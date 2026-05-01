import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { HttpError } from '../middleware/errorHandler';

const upsertSchema = z.object({
  name: z.string().min(1),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  profitShare: z.union([z.number(), z.string()]).transform((v) => Number(v)).default(50),
  active: z.boolean().default(true),
  notes: z.string().nullable().optional(),
});

export async function listPartners(_req: Request, res: Response, next: NextFunction) {
  try {
    const partners = await prisma.partner.findMany({ orderBy: { createdAt: 'asc' } });
    res.json({ partners });
  } catch (err) {
    next(err);
  }
}

export async function createPartner(req: Request, res: Response, next: NextFunction) {
  try {
    const data = upsertSchema.parse(req.body);
    const partner = await prisma.partner.create({
      data: { ...data, profitShare: new Prisma.Decimal(data.profitShare) },
    });
    res.status(201).json({ partner });
  } catch (err) {
    next(err);
  }
}

export async function updatePartner(req: Request, res: Response, next: NextFunction) {
  try {
    const data = upsertSchema.partial().parse(req.body);
    const partner = await prisma.partner.update({
      where: { id: req.params.id },
      data: {
        ...data,
        profitShare: data.profitShare !== undefined ? new Prisma.Decimal(data.profitShare) : undefined,
      },
    });
    res.json({ partner });
  } catch (err) {
    next(err);
  }
}

export async function deletePartner(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.partner.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

// Partner ledger: per-currency balance for each partner
export async function getLedger(_req: Request, res: Response, next: NextFunction) {
  try {
    const partners = await prisma.partner.findMany({
      include: {
        expenses: { include: { invoice: { select: { id: true, status: true, paidAmount: true, total: true } } } },
        withdrawals: true,
      },
    });

    // total profit per currency = sum over all expenses of (billable - cost) where status != PENDING
    const allExpenses = await prisma.expense.findMany();
    const profitByCurrency: Record<string, number> = {};
    for (const e of allExpenses) {
      if (e.status !== 'PENDING') {
        const profit = Number(e.billable) - Number(e.cost);
        profitByCurrency[e.currencyCode] = (profitByCurrency[e.currencyCode] || 0) + profit;
      }
    }

    const totalShare = partners.reduce((s, p) => s + Number(p.profitShare), 0) || 100;

    const ledger = partners.map((p) => {
      const share = Number(p.profitShare) / totalShare;
      const owedBack: Record<string, number> = {}; // cost they paid that hasn't been reimbursed
      for (const e of p.expenses) {
        if (e.status !== 'REIMBURSED') {
          owedBack[e.currencyCode] = (owedBack[e.currencyCode] || 0) + Number(e.cost);
        }
      }
      const profitShare: Record<string, number> = {};
      for (const [cur, total] of Object.entries(profitByCurrency)) {
        profitShare[cur] = total * share;
      }
      const withdrawn: Record<string, number> = {};
      for (const w of p.withdrawals) {
        withdrawn[w.currencyCode] = (withdrawn[w.currencyCode] || 0) + Number(w.amount);
      }
      const currencies = new Set([...Object.keys(owedBack), ...Object.keys(profitShare), ...Object.keys(withdrawn)]);
      const balances: Record<string, { owedBack: number; profitShare: number; withdrawn: number; net: number }> = {};
      for (const cur of currencies) {
        const ob = owedBack[cur] || 0;
        const ps = profitShare[cur] || 0;
        const wd = withdrawn[cur] || 0;
        balances[cur] = { owedBack: ob, profitShare: ps, withdrawn: wd, net: ob + ps - wd };
      }
      return {
        partner: { id: p.id, name: p.name, profitShare: p.profitShare, active: p.active },
        balances,
        expenseCount: p.expenses.length,
      };
    });

    res.json({ ledger, totalProfit: profitByCurrency });
  } catch (err) {
    next(err);
  }
}

const withdrawalSchema = z.object({
  partnerId: z.string(),
  amount: z.union([z.number(), z.string()]).transform((v) => Number(v)),
  currencyCode: z.string().default('IQD'),
  date: z.string().optional(),
  notes: z.string().nullable().optional(),
});

export async function listWithdrawals(req: Request, res: Response, next: NextFunction) {
  try {
    const partnerId = req.query.partnerId as string | undefined;
    const withdrawals = await prisma.withdrawal.findMany({
      where: partnerId ? { partnerId } : undefined,
      include: { partner: { select: { id: true, name: true } } },
      orderBy: { date: 'desc' },
    });
    res.json({ withdrawals });
  } catch (err) {
    next(err);
  }
}

export async function createWithdrawal(req: Request, res: Response, next: NextFunction) {
  try {
    const data = withdrawalSchema.parse(req.body);
    const withdrawal = await prisma.withdrawal.create({
      data: {
        partnerId: data.partnerId,
        amount: new Prisma.Decimal(data.amount),
        currencyCode: data.currencyCode,
        date: data.date ? new Date(data.date) : new Date(),
        notes: data.notes ?? null,
      },
    });
    res.status(201).json({ withdrawal });
  } catch (err) {
    next(err);
  }
}

export async function deleteWithdrawal(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.withdrawal.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
