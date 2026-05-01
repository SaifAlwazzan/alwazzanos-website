import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma, ExpenseStatus } from '@prisma/client';
import { prisma } from '../db';
import { HttpError } from '../middleware/errorHandler';

const upsertSchema = z.object({
  date: z.string().optional(),
  vendor: z.string().min(1),
  description: z.string().nullable().optional(),
  cost: z.union([z.number(), z.string()]).transform((v) => Number(v)),
  currencyCode: z.string().default('IQD'),
  markupPct: z.union([z.number(), z.string()]).transform((v) => Number(v)).default(20),
  paidByPartnerId: z.string().min(1),
  clientId: z.string().nullable().optional(),
  projectId: z.string().nullable().optional(),
  offerId: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  receiptUrl: z.string().nullable().optional(),
});

export async function listExpenses(req: Request, res: Response, next: NextFunction) {
  try {
    const where: Prisma.ExpenseWhereInput = {};
    if (req.query.partnerId) where.paidByPartnerId = req.query.partnerId as string;
    if (req.query.clientId) where.clientId = req.query.clientId as string;
    if (req.query.projectId) where.projectId = req.query.projectId as string;
    if (req.query.offerId) where.offerId = req.query.offerId as string;
    if (req.query.invoiceId) where.invoiceId = req.query.invoiceId as string;
    if (req.query.status) where.status = req.query.status as ExpenseStatus;
    if (req.query.unbilled === 'true') where.invoiceId = null;
    if (req.query.noProject === 'true') where.projectId = null;

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        paidByPartner: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, code: true } },
        offer: { select: { id: true, number: true, title: true } },
        invoice: { select: { id: true, number: true, status: true } },
      },
      orderBy: { date: 'desc' },
    });
    res.json({ expenses });
  } catch (err) {
    next(err);
  }
}

export async function getExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: req.params.id },
      include: { paidByPartner: true, client: true, offer: true, invoice: true },
    });
    if (!expense) throw new HttpError(404, 'Expense not found');
    res.json({ expense });
  } catch (err) {
    next(err);
  }
}

export async function createExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const body = { ...req.body };
    if (req.file) body.receiptUrl = `/uploads/${req.file.filename}`;
    const data = upsertSchema.parse(body);
    const billable = data.cost * (1 + data.markupPct / 100);
    const expense = await prisma.expense.create({
      data: {
        date: data.date ? new Date(data.date) : new Date(),
        vendor: data.vendor,
        description: data.description ?? null,
        cost: new Prisma.Decimal(data.cost),
        currencyCode: data.currencyCode,
        markupPct: new Prisma.Decimal(data.markupPct),
        billable: new Prisma.Decimal(billable),
        paidByPartnerId: data.paidByPartnerId,
        clientId: data.clientId ?? null,
        projectId: data.projectId ?? null,
        offerId: data.offerId ?? null,
        notes: data.notes ?? null,
        receiptUrl: data.receiptUrl ?? null,
      },
    });
    res.status(201).json({ expense });
  } catch (err) {
    next(err);
  }
}

export async function updateExpense(req: Request, res: Response, next: NextFunction) {
  try {
    const body = { ...req.body };
    if (req.file) body.receiptUrl = `/uploads/${req.file.filename}`;
    const data = upsertSchema.partial().parse(body);
    const updateData: Prisma.ExpenseUpdateInput = { ...data } as any;
    if (data.cost !== undefined || data.markupPct !== undefined) {
      const current = await prisma.expense.findUnique({ where: { id: req.params.id } });
      if (!current) throw new HttpError(404, 'Expense not found');
      const cost = data.cost ?? Number(current.cost);
      const markup = data.markupPct ?? Number(current.markupPct);
      updateData.cost = new Prisma.Decimal(cost);
      updateData.markupPct = new Prisma.Decimal(markup);
      updateData.billable = new Prisma.Decimal(cost * (1 + markup / 100));
    }
    if (data.paidByPartnerId) {
      delete (updateData as any).paidByPartnerId;
      updateData.paidByPartner = { connect: { id: data.paidByPartnerId } };
    }
    if (data.clientId !== undefined) {
      delete (updateData as any).clientId;
      updateData.client = data.clientId ? { connect: { id: data.clientId } } : { disconnect: true };
    }
    if (data.projectId !== undefined) {
      delete (updateData as any).projectId;
      updateData.project = data.projectId ? { connect: { id: data.projectId } } : { disconnect: true };
    }
    if (data.offerId !== undefined) {
      delete (updateData as any).offerId;
      updateData.offer = data.offerId ? { connect: { id: data.offerId } } : { disconnect: true };
    }
    const expense = await prisma.expense.update({ where: { id: req.params.id }, data: updateData });
    res.json({ expense });
  } catch (err) {
    next(err);
  }
}

export async function deleteExpense(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.expense.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

const pushToInvoiceSchema = z.object({
  invoiceId: z.string(),
  expenseIds: z.array(z.string()).min(1),
});

export async function pushToInvoice(req: Request, res: Response, next: NextFunction) {
  try {
    const data = pushToInvoiceSchema.parse(req.body);
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: { items: true },
    });
    if (!invoice) throw new HttpError(404, 'Invoice not found');

    const expenses = await prisma.expense.findMany({ where: { id: { in: data.expenseIds } } });
    if (expenses.length === 0) throw new HttpError(400, 'No expenses found');

    let order = invoice.items.length;
    let addedSubtotal = 0;
    for (const exp of expenses) {
      const item = await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          name: `${exp.vendor} — ${exp.description || 'Expense'}`,
          description: `Cost: ${Number(exp.cost).toLocaleString()} ${exp.currencyCode} + ${Number(exp.markupPct)}% markup`,
          quantity: 1,
          unitPrice: exp.billable,
          total: exp.billable,
          order: order++,
        },
      });
      await prisma.expense.update({
        where: { id: exp.id },
        data: {
          invoiceId: invoice.id,
          invoiceItemId: item.id,
          status: 'BILLED',
        },
      });
      addedSubtotal += Number(exp.billable);
    }

    // Recalc invoice totals
    const newSubtotal = Number(invoice.subtotal) + addedSubtotal;
    const newTotal = newSubtotal - Number(invoice.discount) + Number(invoice.tax);
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        subtotal: new Prisma.Decimal(newSubtotal),
        total: new Prisma.Decimal(newTotal),
      },
    });

    res.json({ added: expenses.length, addedAmount: addedSubtotal });
  } catch (err) {
    next(err);
  }
}

export async function reimburse(req: Request, res: Response, next: NextFunction) {
  try {
    const expense = await prisma.expense.update({
      where: { id: req.params.id },
      data: { status: 'REIMBURSED' },
    });
    res.json({ expense });
  } catch (err) {
    next(err);
  }
}
