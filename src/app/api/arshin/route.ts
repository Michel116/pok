import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { serialNumber } = await request.json();

    if (!serialNumber) {
      return NextResponse.json({ error: 'Serial number required' }, { status: 400 });
    }

    const url = `https://fgis.gost.ru/fundmetrology/cm/results?activeYear=%D0%92%D1%81%D0%B5&search=${encodeURIComponent(serialNumber)}`;

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    await page.waitForSelector('table', { timeout: 15000 });

    const html = await page.content();

    await browser.close();

    const $ = cheerio.load(html);

    const rows = $('table tbody tr');

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No results found in Arshin' }, { status: 404 });
    }

    let targetRow = null;
    rows.each((index, row) => {
      const cells = $(row).find('td');
      const typeSI = cells.eq(3).text().trim();
      if (typeSI.includes('ЭСМО')) {
        targetRow = $(row);
        return false;
      }
    });

    if (!targetRow) {
      return NextResponse.json({ error: 'ЭСМО not found in results' }, { status: 404 });
    }

    const cells = targetRow.find('td');
    
    const lastVerificationDateStr = cells.eq(6).text().trim();
    const verifiedUntilStr = cells.eq(7).text().trim();

    const parseDate = (dateStr: string) => {
      if (!dateStr) return null;
      const parts = dateStr.split('.');
      if (parts.length !== 3) return null;
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    const lastVerificationDate = parseDate(lastVerificationDateStr);
    const verifiedUntil = parseDate(verifiedUntilStr);

    if (!lastVerificationDate || !verifiedUntil) {
      return NextResponse.json({ error: 'Invalid date format in Arshin data' }, { status: 400 });
    }

    return NextResponse.json({
      lastVerificationDate,
      verifiedUntil,
      isValidType: true
    });

  } catch (error) {
    console.error('Arshin fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch data from Arshin' }, { status: 500 });
  }
}
