import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'events.json');

export async function GET() {
    try {
        const fileData = await fs.readFile(DATA_PATH, 'utf-8');
        return NextResponse.json({ events: JSON.parse(fileData), version: '1.0' });

    } catch (error) {
        console.error('Error reading events:', error);
        return NextResponse.json({ events: [], version: '1.0' });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving events:', error);
        return NextResponse.json({ success: false, error: 'Failed to save data' }, { status: 500 });
    }
}
