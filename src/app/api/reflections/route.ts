import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const reflections = await prisma.reflection.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(reflections)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch reflections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date, items, selectedItem, chatMessages } = await request.json()

    const reflection = await prisma.reflection.upsert({
      where: { date },
      update: { items, selectedItem, chatMessages },
      create: { date, items, selectedItem, chatMessages },
    })

    return NextResponse.json(reflection)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save reflection' }, { status: 500 })
  }
}
