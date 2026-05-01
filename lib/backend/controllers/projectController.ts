import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProjectStatus, Prisma } from '@prisma/client';
import { prisma } from '../db';
import { HttpError } from '../middleware/errorHandler';

const upsertSchema = z.object({
  name: z.string().min(1),
  code: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.ACTIVE),
  clientId: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  budget: z.union([z.number(), z.string()]).transform((v) => Number(v)).nullable().optional(),
  currencyCode: z.string().default('IQD'),
  notes: z.string().nullable().optional(),
});

export async function listProjects(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status as ProjectStatus | undefined;
    const clientId = req.query.clientId as string | undefined;
    const projects = await prisma.project.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(clientId ? { clientId } : {}),
      },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { offers: true, invoices: true, expenses: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ projects });
  } catch (err) {
    next(err);
  }
}

export async function getProject(req: Request, res: Response, next: NextFunction) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        offers: { orderBy: { createdAt: 'desc' } },
        invoices: { orderBy: { createdAt: 'desc' }, include: { payments: true } },
        expenses: {
          orderBy: { date: 'desc' },
          include: { paidByPartner: { select: { id: true, name: true } } },
        },
      },
    });
    if (!project) throw new HttpError(404, 'Project not found');

    // Calculate financial summary by currency
    const summary: Record<string, { revenue: number; collected: number; cost: number; billable: number; profit: number }> = {};
    const ensure = (cur: string) => {
      if (!summary[cur]) summary[cur] = { revenue: 0, collected: 0, cost: 0, billable: 0, profit: 0 };
      return summary[cur];
    };
    for (const inv of project.invoices) {
      const s = ensure(inv.currencyCode);
      s.revenue += Number(inv.total);
      s.collected += Number(inv.paidAmount);
    }
    for (const exp of project.expenses) {
      const s = ensure(exp.currencyCode);
      s.cost += Number(exp.cost);
      s.billable += Number(exp.billable);
      s.profit += Number(exp.billable) - Number(exp.cost);
    }

    res.json({ project, summary });
  } catch (err) {
    next(err);
  }
}

export async function createProject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = upsertSchema.parse(req.body);
    const project = await prisma.project.create({
      data: {
        name: data.name,
        code: data.code ?? null,
        description: data.description ?? null,
        status: data.status,
        clientId: data.clientId ?? null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        budget: data.budget != null ? new Prisma.Decimal(data.budget) : null,
        currencyCode: data.currencyCode,
        notes: data.notes ?? null,
      },
    });
    res.status(201).json({ project });
  } catch (err) {
    next(err);
  }
}

export async function updateProject(req: Request, res: Response, next: NextFunction) {
  try {
    const data = upsertSchema.partial().parse(req.body);
    const updateData: Prisma.ProjectUpdateInput = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.code !== undefined && { code: data.code }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.startDate !== undefined && { startDate: data.startDate ? new Date(data.startDate) : null }),
      ...(data.endDate !== undefined && { endDate: data.endDate ? new Date(data.endDate) : null }),
      ...(data.budget !== undefined && { budget: data.budget != null ? new Prisma.Decimal(data.budget) : null }),
      ...(data.currencyCode !== undefined && { currencyCode: data.currencyCode }),
      ...(data.notes !== undefined && { notes: data.notes }),
    };
    if (data.clientId !== undefined) {
      updateData.client = data.clientId ? { connect: { id: data.clientId } } : { disconnect: true };
    }
    const project = await prisma.project.update({ where: { id: req.params.id }, data: updateData });
    res.json({ project });
  } catch (err) {
    next(err);
  }
}

export async function deleteProject(req: Request, res: Response, next: NextFunction) {
  try {
    await prisma.project.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
