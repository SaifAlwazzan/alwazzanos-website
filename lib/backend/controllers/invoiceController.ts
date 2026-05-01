import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { InvoiceStatus, InstallmentStatus, PaymentMethod, Prisma } from '@prisma/client';
import { prisma } from '../db';
import { HttpError } from '../middleware/errorHandler';

const itemSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.union([z.number(), z.string()]).transform((v) => Number(v)),
});

const installmentInputSchema = z.object({
  number: z.number().int().min(1),
  dueDate: z.string(),
  amount: z.union([z.number(), z.string()]).transform((v) => Number(v)),
});

const upsertSchema = z.object({
  clientId: z.string().min(1),
  offerId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  status: z.nativeEnum(InvoiceStatus).default(InvoiceStatus.UNPAID),
  currencyCode: z.string().default('IQD'),
  discount: z.union([z.number(), z.string()]).transform((v) => Number(v)).default(0),
  tax: z.union([z.number(), z.string()]).transform((v) => Number(v)).default(0),
  issueDate: z.string().optional(),
  dueDate: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(itemSchema).default([]),
  installments: z.array(installmentInputSchema).default([]),
});

function calcTotals(items: { quantity: number; unitPrice: number }[], discount: number, tax: number) {
  const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0);
  const total = Math.max(0, subtotal - discount + tax);
  return { subtotal, total };
}

async function nextInvoiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `AWZ-INV-${year}-`;
  const last = await prisma.invoice.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: 'desc' },
  });
  const seq = last ? parseInt(last.number.substring(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

async function recalcInvoiceStatus(invoiceId: string) {
  const inv = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true },
  });
  if (!inv) return;
  const paidAmount = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
  const total = Number(inv.total);
  let status: InvoiceStatus = InvoiceStatus.UNPAID;
  if (paidAmount >= total && total > 0) status = InvoiceStatus.PAID;
  else if (paidAmount > 0) status = InvoiceStatus.PARTIALLY_PAID;
  await prisma.invoice.update({
    where: { id: invoiceId },
    data: { paidAmount: new Prisma.Decimal(paidAmount), status },
  });
}

export async function listInvoices(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as InvoiceStatus | undefined;
    const clientId = req.query.clientId as string | undefined;
    const projectId = req.query.projectId as string | undefined;
    const invoices = await prisma.invoice.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(clientId ? { clientId } : {}),
        ...(projectId ? { projectId } : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { items: true, installments: true, payments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ invoices });
  } catch (err) {
    next(err);
  }
}

export async function getInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        offer: { select: { id: true, number: true, title: true } },
        createdBy: { select: { id: true, name: true } },
        items: { orderBy: { order: 'asc' } },
        installments: { orderBy: { number: 'asc' } },
        payments: { orderBy: { paidAt: 'desc' } },
        attachments: { orderBy: { uploadedAt: 'desc' } },
      },
    });
    if (!invoice) throw new HttpError(404, 'Invoice not found');
    res.json({ invoice });
  } catch (err) {
    next(err);
  }
}

export async function createInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const data = upsertSchema.parse(req.body);
    const { subtotal, total } = calcTotals(data.items, data.discount, data.tax);
    const number = await nextInvoiceNumber();

    const invoice = await prisma.invoice.create({
      data: {
        number,
        clientId: data.clientId,
        offerId: data.offerId ?? null,
        projectId: data.projectId ?? null,
        status: data.status,
        currencyCode: data.currencyCode,
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(data.discount),
        tax: new Prisma.Decimal(data.tax),
        total: new Prisma.Decimal(total),
        issueDate: data.issueDate ? new Date(data.issueDate) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes ?? null,
        createdById: req.user!.userId,
        items: {
          create: data.items.map((it, idx) => ({
            name: it.name,
            description: it.description ?? null,
            quantity: it.quantity,
            unitPrice: new Prisma.Decimal(it.unitPrice),
            total: new Prisma.Decimal(it.quantity * it.unitPrice),
            order: idx,
          })),
        },
        installments: {
          create: data.installments.map((ins) => ({
            number: ins.number,
            dueDate: new Date(ins.dueDate),
            amount: new Prisma.Decimal(ins.amount),
          })),
        },
      },
      include: { items: true, installments: true, client: true },
    });
    res.status(201).json({ invoice });
  } catch (err) {
    next(err);
  }
}

export async function updateInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const data = upsertSchema.parse(req.body);
    const { subtotal, total } = calcTotals(data.items, data.discount, data.tax);
    const invoice = await prisma.$transaction(async (tx) => {
      await tx.invoiceItem.deleteMany({ where: { invoiceId: req.params.id } });
      // Only delete installments that have no payments
      const existing = await tx.installment.findMany({
        where: { invoiceId: req.params.id },
        include: { payments: true },
      });
      for (const ins of existing) {
        if (ins.payments.length === 0) {
          await tx.installment.delete({ where: { id: ins.id } });
        }
      }
      return tx.invoice.update({
        where: { id: req.params.id },
        data: {
          clientId: data.clientId,
          offerId: data.offerId ?? null,
          projectId: data.projectId ?? null,
          currencyCode: data.currencyCode,
          subtotal: new Prisma.Decimal(subtotal),
          discount: new Prisma.Decimal(data.discount),
          tax: new Prisma.Decimal(data.tax),
          total: new Prisma.Decimal(total),
          issueDate: data.issueDate ? new Date(data.issueDate) : undefined,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          notes: data.notes ?? null,
          items: {
            create: data.items.map((it, idx) => ({
              name: it.name,
              description: it.description ?? null,
              quantity: it.quantity,
              unitPrice: new Prisma.Decimal(it.unitPrice),
              total: new Prisma.Decimal(it.quantity * it.unitPrice),
              order: idx,
            })),
          },
          installments: {
            create: data.installments
              .filter((ins) => !existing.some((e) => e.number === ins.number && e.payments.length > 0))
              .map((ins) => ({
                number: ins.number,
                dueDate: new Date(ins.dueDate),
                amount: new Prisma.Decimal(ins.amount),
              })),
          },
        },
        include: { items: true, installments: true, client: true },
      });
    });
    await recalcInvoiceStatus(invoice.id);
    res.json({ invoice });
  } catch (err) {
    next(err);
  }
}

export async function deleteInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.invoice.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

const paymentSchema = z.object({
  amount: z.union([z.number(), z.string()]).transform((v) => Number(v)),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  reference: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  paidAt: z.string().optional(),
  installmentId: z.string().nullable().optional(),
});

export async function addPayment(req: Request, res: Response, next: NextFunction) {
  try {
    const data = paymentSchema.parse(req.body);
    const invoiceId = req.params.id;

    const payment = await prisma.payment.create({
      data: {
        invoiceId,
        installmentId: data.installmentId ?? null,
        amount: new Prisma.Decimal(data.amount),
        method: data.method,
        reference: data.reference ?? null,
        notes: data.notes ?? null,
        paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
      },
    });

    if (data.installmentId) {
      const ins = await prisma.installment.findUnique({
        where: { id: data.installmentId },
        include: { payments: true },
      });
      if (ins) {
        const totalPaid = ins.payments.reduce((s, p) => s + Number(p.amount), 0) + Number(data.amount);
        const insStatus: InstallmentStatus =
          totalPaid >= Number(ins.amount) ? InstallmentStatus.PAID : InstallmentStatus.PENDING;
        await prisma.installment.update({
          where: { id: data.installmentId },
          data: {
            status: insStatus,
            paidAt: insStatus === InstallmentStatus.PAID ? new Date() : null,
          },
        });
      }
    }

    await recalcInvoiceStatus(invoiceId);
    res.status(201).json({ payment });
  } catch (err) {
    next(err);
  }
}

export async function deletePayment(req: Request, res: Response, next: NextFunction) {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.paymentId } });
    if (!payment) throw new HttpError(404, 'Payment not found');
    await prisma.payment.delete({ where: { id: req.params.paymentId } });
    if (payment.installmentId) {
      const ins = await prisma.installment.findUnique({
        where: { id: payment.installmentId },
        include: { payments: true },
      });
      if (ins) {
        const totalPaid = ins.payments.reduce((s, p) => s + Number(p.amount), 0);
        await prisma.installment.update({
          where: { id: payment.installmentId },
          data: {
            status: totalPaid >= Number(ins.amount) ? InstallmentStatus.PAID : InstallmentStatus.PENDING,
            paidAt: totalPaid >= Number(ins.amount) ? new Date() : null,
          },
        });
      }
    }
    await recalcInvoiceStatus(payment.invoiceId);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

const installmentBulkSchema = z.object({
  upfront: z.union([z.number(), z.string()]).transform((v) => Number(v)).default(0),
  installmentCount: z.number().int().min(1),
  firstInstallmentDate: z.string(),
  intervalDays: z.number().int().default(30),
  recordUpfrontAsPaid: z.boolean().default(false),
});

export async function setupPaymentPlan(req: Request, res: Response, next: NextFunction) {
  try {
    const data = installmentBulkSchema.parse(req.body);
    const invoiceId = req.params.id;
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { installments: { include: { payments: true } } },
    });
    if (!invoice) throw new HttpError(404, 'Invoice not found');

    // Block if any existing installment has payments
    const lockedInstallments = invoice.installments.filter((i) => i.payments.length > 0);
    if (lockedInstallments.length > 0) {
      throw new HttpError(400, 'Cannot reset payment plan: some installments already have payments');
    }

    // Delete existing unpaid installments
    await prisma.installment.deleteMany({ where: { invoiceId } });

    const total = Number(invoice.total);
    const remaining = Math.max(0, total - data.upfront);
    const each = Math.round((remaining / data.installmentCount) * 100) / 100;
    const startDate = new Date(data.firstInstallmentDate);

    const installmentsToCreate = [];
    for (let i = 0; i < data.installmentCount; i++) {
      const due = new Date(startDate);
      due.setDate(due.getDate() + i * data.intervalDays);
      const amount =
        i === data.installmentCount - 1
          ? remaining - each * (data.installmentCount - 1)
          : each;
      installmentsToCreate.push({
        invoiceId,
        number: i + 1,
        dueDate: due,
        amount: new Prisma.Decimal(amount),
      });
    }

    await prisma.installment.createMany({ data: installmentsToCreate });

    if (data.recordUpfrontAsPaid && data.upfront > 0) {
      await prisma.payment.create({
        data: {
          invoiceId,
          amount: new Prisma.Decimal(data.upfront),
          method: PaymentMethod.CASH,
          notes: 'Upfront payment',
        },
      });
      await recalcInvoiceStatus(invoiceId);
    }

    res.json({ count: installmentsToCreate.length });
  } catch (err) {
    next(err);
  }
}

export async function uploadAttachment(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) throw new HttpError(400, 'No file uploaded');
    const attachment = await prisma.invoiceAttachment.create({
      data: {
        invoiceId: req.params.id,
        name: req.file.originalname,
        url: `/uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
        notes: (req.body.notes as string) || null,
      },
    });
    res.status(201).json({ attachment });
  } catch (err) {
    next(err);
  }
}

export async function deleteAttachment(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.invoiceAttachment.delete({ where: { id: req.params.attachmentId } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function deleteInstallment(req: Request, res: Response, next: NextFunction) {
  try {
    const ins = await prisma.installment.findUnique({
      where: { id: req.params.installmentId },
      include: { payments: true },
    });
    if (!ins) throw new HttpError(404, 'Installment not found');
    if (ins.payments.length > 0) throw new HttpError(400, 'Cannot delete: installment has payments');
    await prisma.installment.delete({ where: { id: ins.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

const generateFromOfferSchema = z.object({
  offerId: z.string(),
  upfront: z.union([z.number(), z.string()]).transform((v) => Number(v)).default(0),
  installmentCount: z.number().int().min(0).default(0),
  firstInstallmentDate: z.string().optional(),
  intervalDays: z.number().int().default(30),
});

export async function generateFromOffer(req: Request, res: Response, next: NextFunction) {
  try {
    const data = generateFromOfferSchema.parse(req.body);
    const offer = await prisma.offer.findUnique({
      where: { id: data.offerId },
      include: { items: { orderBy: { order: 'asc' } }, client: true },
    });
    if (!offer) throw new HttpError(404, 'Offer not found');

    const number = await nextInvoiceNumber();
    const total = Number(offer.total);
    const remaining = Math.max(0, total - data.upfront);
    const installments: { number: number; dueDate: Date; amount: number }[] = [];
    if (data.installmentCount > 0) {
      const each = Math.round((remaining / data.installmentCount) * 100) / 100;
      const startDate = data.firstInstallmentDate ? new Date(data.firstInstallmentDate) : new Date();
      for (let i = 0; i < data.installmentCount; i++) {
        const due = new Date(startDate);
        due.setDate(due.getDate() + i * data.intervalDays);
        installments.push({
          number: i + 1,
          dueDate: due,
          amount: i === data.installmentCount - 1 ? remaining - each * (data.installmentCount - 1) : each,
        });
      }
    }

    const invoice = await prisma.invoice.create({
      data: {
        number,
        clientId: offer.clientId,
        offerId: offer.id,
        currencyCode: offer.currencyCode,
        subtotal: offer.subtotal,
        discount: offer.discount,
        tax: offer.tax,
        total: offer.total,
        notes: `Generated from offer ${offer.number}`,
        createdById: req.user!.userId,
        items: {
          create: offer.items.map((it, idx) => ({
            name: it.name,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            total: it.total,
            order: idx,
          })),
        },
        installments: {
          create: installments.map((ins) => ({
            number: ins.number,
            dueDate: ins.dueDate,
            amount: new Prisma.Decimal(ins.amount),
          })),
        },
      },
      include: { items: true, installments: true, client: true },
    });

    // Record upfront as a payment
    if (data.upfront > 0) {
      await prisma.payment.create({
        data: {
          invoiceId: invoice.id,
          amount: new Prisma.Decimal(data.upfront),
          method: PaymentMethod.CASH,
          notes: 'Upfront payment',
        },
      });
      await recalcInvoiceStatus(invoice.id);
    }

    res.status(201).json({ invoice });
  } catch (err) {
    next(err);
  }
}
