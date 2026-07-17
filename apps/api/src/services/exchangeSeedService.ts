import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Types } from 'mongoose';
import { Exchange } from '../database/models/Exchange';
import { ListedCompany } from '../database/models/ListedCompany';
import { Stock } from '../database/models/Stock';
import { MarketIndex } from '../database/models/MarketIndex';
import { Trade } from '../database/models/Trade';
import { ExchangeNews } from '../database/models/ExchangeNews';
import { StockHistory } from '../database/models/StockHistory';
import { Company } from '../database/models/Company';
import { CompanyValuation } from '../database/models/CompanyValuation';
import { EXCHANGE_ID, DEFAULT_OUTSTANDING_SHARES } from '../constants/exchange';
import { currentPeriod } from './economyIntegrationService';
import { getEconomyValuation } from './exchangeIntegrationService';
import { updateStockPrice } from './exchangePriceService';
import { provisionCompanyBanking } from './businessBankService';

const SEED_COMPANIES = [
  { name: 'Gulf National Bank', ticker: 'GNBK', sector: 'finance', type: 'bank' },
  { name: 'Emirates Realty Group', ticker: 'ERLG', sector: 'real_estate', type: 'real_estate' },
  { name: 'Arabian Motors Holdings', ticker: 'AMHD', sector: 'automotive', type: 'vehicle_dealership' },
  { name: 'Gulf Sky Airlines', ticker: 'GSAL', sector: 'aviation', type: 'airline' },
  { name: 'Maritime Gulf Corp', ticker: 'MGCP', sector: 'marine', type: 'marine' },
  { name: 'Desert Tech Solutions', ticker: 'DTSL', sector: 'technology', type: 'technology' },
  { name: 'Gulf Healthcare Systems', ticker: 'GHCS', sector: 'healthcare', type: 'healthcare' },
  { name: 'Peninsula Construction', ticker: 'PNCL', sector: 'industrial', type: 'construction' },
  { name: 'Gulf Media Network', ticker: 'GMNW', sector: 'media', type: 'media' },
  { name: 'Sahara Retail Group', ticker: 'SRGP', sector: 'retail', type: 'retail' },
  { name: 'Gulf Energy Partners', ticker: 'GEPT', sector: 'energy', type: 'industrial' },
  { name: 'Falcon Investment Co', ticker: 'FICO', sector: 'finance', type: 'investment' },
  { name: 'Gulf Government Holdings', ticker: 'GGHD', sector: 'government', type: 'government' },
  { name: 'Oasis Industrial', ticker: 'OIND', sector: 'industrial', type: 'industrial' },
  { name: 'Pearl Hospitality', ticker: 'PHOS', sector: 'retail', type: 'retail' },
];

const NEWS_TEMPLATES = [
  { category: 'market', title: 'GULF Exchange Opens Trading Session', impact: 0.1 },
  { category: 'economic', title: 'Economy Engine Reports GDP Growth', impact: 0.15 },
  { category: 'government', title: 'Regulatory Framework Updated for Listed Companies', impact: 0.05 },
  { category: 'ipo', title: 'New IPO Pipeline Announced for Q3', impact: 0.08 },
  { category: 'dividend', title: 'Quarterly Dividend Season Begins', impact: 0.06 },
  { category: 'company', title: '{name} Reports Strong Quarterly Performance', impact: 0.12 },
  { category: 'market', title: 'Trading Volume Reaches New High', impact: 0.07 },
  { category: 'economic', title: 'Inflation Remains Within Target Range', impact: 0.04 },
];

function walletId(userId: string) {
  return `WLT-INV-${userId.slice(-6)}-${uuidv4().slice(0, 4).toUpperCase()}`;
}

export async function seedExchangeData(ownerUserId?: string): Promise<Record<string, number>> {
  const existing = await Exchange.findOne({ exchangeId: EXCHANGE_ID });
  if (existing && existing.listedCount > 0) {
    return { skipped: 1, listed: existing.listedCount };
  }

  await Exchange.findOneAndUpdate(
    { exchangeId: EXCHANGE_ID },
    {
      exchangeId: EXCHANGE_ID,
      name: 'GULF Exchange',
      shortName: 'GULFX',
      currency: 'GULF',
      status: 'open',
    },
    { upsert: true }
  );

  const period = currentPeriod();
  let companies = await Company.find({ deletedAt: null }).limit(40);
  const userId = ownerUserId ? new Types.ObjectId(ownerUserId) : companies[0]?.ownerUserId;

  if (companies.length < SEED_COMPANIES.length) {
    for (let i = companies.length; i < SEED_COMPANIES.length; i++) {
      const seed = SEED_COMPANIES[i];
      const companyId = `CO-${uuidv4().slice(0, 8).toUpperCase()}`;
      const banking = provisionCompanyBanking(companyId);
      const company = await Company.create({
        companyId,
        name: seed.name,
        tradeName: seed.name,
        licenseNumber: `LIC-${i + 1000}`,
        commercialRegistration: `CR-${i + 5000}`,
        taxNumber: `TAX-${i + 9000}`,
        category: seed.type,
        ownerUserId: userId ?? new Types.ObjectId(),
        partners: [],
        shareholders: [],
        headquarters: { address: '1 Exchange Tower', city: 'Dubai', district: 'DIFC', country: 'UAE' },
        email: `ir@${seed.ticker.toLowerCase()}.gulf`,
        phone: `+971-4-${String(1000000 + i).slice(-7)}`,
        status: 'active',
        ...banking,
        totalRevenue: 500_000 + i * 100_000,
        totalExpenses: 300_000 + i * 50_000,
        netProfit: 200_000 + i * 50_000,
        totalAssets: 2_000_000 + i * 500_000,
        employeeCount: 50 + i * 10,
        customerCount: 200 + i * 50,
      });
      companies.push(company);

      await CompanyValuation.findOneAndUpdate(
        { companyId, period },
        {
          valuationId: `CVAL-${companyId}-${period}`,
          companyId,
          companyName: seed.name,
          period,
          totalValuation: company.totalAssets + company.netProfit * 8,
          cash: company.cashBalance,
          bankBalance: company.availableBalance,
          revenue: company.totalRevenue,
          expenses: company.totalExpenses,
          profit: company.netProfit,
          employees: company.employeeCount,
          assets: company.totalAssets,
          customers: company.customerCount,
          businessRating: 3.5 + (i % 3) * 0.5,
          rank: i + 1,
          computedAt: new Date(),
        },
        { upsert: true }
      );
    }
  }

  const listedCount = Math.min(15, companies.length);
  const stocks: { stockId: string; ticker: string; sector: string }[] = [];

  for (let i = 0; i < listedCount; i++) {
    const company = companies[i];
    const seed = SEED_COMPANIES[i] ?? { ticker: `GULF${i}`, sector: 'other', type: 'public' };
    const ticker = seed.ticker;
    const listedCompanyId = `LC-${uuidv4().slice(0, 8).toUpperCase()}`;
    const stockId = `STK-${uuidv4().slice(0, 8).toUpperCase()}`;

    let valuation;
    try {
      valuation = await getEconomyValuation(company.companyId);
    } catch {
      valuation = await CompanyValuation.findOne({ companyId: company.companyId });
    }
    const totalVal = valuation?.totalValuation ?? company.totalAssets;
    const openPrice = roundPrice(totalVal / DEFAULT_OUTSTANDING_SHARES);

    await ListedCompany.findOneAndUpdate(
      { companyId: company.companyId },
      {
        listedCompanyId,
        companyId: company.companyId,
        exchangeId: EXCHANGE_ID,
        ticker,
        name: company.name,
        sector: seed.sector,
        companyType: seed.type,
        tradingStatus: 'active',
        listedAt: new Date(Date.now() - i * 86400000 * 30),
        outstandingShares: DEFAULT_OUTSTANDING_SHARES,
        availableShares: DEFAULT_OUTSTANDING_SHARES * 0.7,
        marketCap: openPrice * DEFAULT_OUTSTANDING_SHARES,
        economyValuationId: valuation?.valuationId,
        ownerUserId: company.ownerUserId,
      },
      { upsert: true }
    );

    await Stock.findOneAndUpdate(
      { ticker },
      {
        stockId,
        ticker,
        listedCompanyId,
        companyId: company.companyId,
        exchangeId: EXCHANGE_ID,
        name: company.name,
        sector: seed.sector,
        currentPrice: openPrice,
        openingPrice: openPrice,
        closingPrice: openPrice,
        high: openPrice * 1.05,
        low: openPrice * 0.95,
        marketCap: openPrice * DEFAULT_OUTSTANDING_SHARES,
        outstandingShares: DEFAULT_OUTSTANDING_SHARES,
        availableShares: DEFAULT_OUTSTANDING_SHARES * 0.7,
        bookValue: openPrice,
        week52High: openPrice * 1.2,
        week52Low: openPrice * 0.8,
        tradingStatus: 'active',
        economyValuationId: valuation?.valuationId,
      },
      { upsert: true }
    );

    stocks.push({ stockId, ticker, sector: seed.sector });
    await updateStockPrice(stockId);
  }

  const indexDefs = [
    { indexId: 'GULF20', name: 'GULF 20 Index', shortName: 'GULF20', sector: undefined },
    { indexId: 'GULF-BIZ', name: 'GULF Business Index', shortName: 'GULF-BIZ', sector: 'finance' },
    { indexId: 'GULF-PROP', name: 'GULF Property Index', shortName: 'GULF-PROP', sector: 'real_estate' },
    { indexId: 'GULF-AUTO', name: 'GULF Auto Index', shortName: 'GULF-AUTO', sector: 'automotive' },
    { indexId: 'GULF-AVIA', name: 'GULF Aviation Index', shortName: 'GULF-AVIA', sector: 'aviation' },
  ];

  for (const idx of indexDefs) {
    const constituents = stocks
      .filter((s) => !idx.sector || s.sector === idx.sector)
      .slice(0, 10)
      .map((s, j, arr) => ({ stockId: s.stockId, ticker: s.ticker, weight: 1 / arr.length }));

    const stockPrices = await Stock.find({ stockId: { $in: constituents.map((c) => c.stockId) } });
    const value = stockPrices.reduce((sum, s, _, arr) => sum + s.currentPrice * (1000 / arr.length), 0);

    await MarketIndex.findOneAndUpdate(
      { indexId: idx.indexId },
      {
        indexId: idx.indexId,
        name: idx.name,
        shortName: idx.shortName,
        exchangeId: EXCHANGE_ID,
        value: value || 1000,
        previousValue: value || 1000,
        constituents,
        sector: idx.sector,
        computedAt: new Date(),
      },
      { upsert: true }
    );
  }

  let tradeCount = 0;
  const targetTrades = 150;
  for (let t = 0; t < targetTrades; t++) {
    const stock = stocks[t % stocks.length];
    const s = await Stock.findOne({ stockId: stock.stockId });
    if (!s) continue;
    const price = s.currentPrice * (0.98 + (t % 5) * 0.01);
    const qty = 10 + (t % 50);
    await Trade.create({
      tradeId: `TRD-SEED-${t}`,
      orderId: `ORD-SEED-${t}`,
      userId: userId ?? new Types.ObjectId(),
      stockId: stock.stockId,
      ticker: stock.ticker,
      side: t % 2 === 0 ? 'buy' : 'sell',
      quantity: qty,
      price: roundPrice(price),
      total: roundPrice(price * qty),
      fee: roundPrice(price * qty * 0.001),
      executedAt: new Date(Date.now() - t * 3600000),
    });
    tradeCount++;
  }

  let newsCount = 0;
  for (let n = 0; n < 60; n++) {
    const tmpl = NEWS_TEMPLATES[n % NEWS_TEMPLATES.length];
    const company = companies[n % listedCount];
    await ExchangeNews.findOneAndUpdate(
      { newsId: `NEWS-SEED-${n}` },
      {
        newsId: `NEWS-SEED-${n}`,
        category: tmpl.category,
        title: tmpl.title.replace('{name}', company?.name ?? 'Gulf Corp'),
        summary: tmpl.title,
        body: `${tmpl.title}. Market impact expected.`,
        ticker: stocks[n % stocks.length]?.ticker,
        companyId: company?.companyId,
        impact: tmpl.impact,
        publishedAt: new Date(Date.now() - n * 7200000),
        isPublished: true,
      },
      { upsert: true }
    );
    newsCount++;
  }

  const totalCap = await Stock.aggregate([
    { $match: { deletedAt: null } },
    { $group: { _id: null, total: { $sum: '$marketCap' } } },
  ]);

  await Exchange.updateOne(
    { exchangeId: EXCHANGE_ID },
    {
      listedCount,
      indexCount: indexDefs.length,
      totalMarketCap: totalCap[0]?.total ?? 0,
      lastPriceUpdateAt: new Date(),
    }
  );

  return { listed: listedCount, stocks: stocks.length, indexes: indexDefs.length, trades: tradeCount, news: newsCount };
}

export function generatePortfolioIban(userId: string): string {
  const hash = crypto.createHash('sha256').update(`inv-${userId}`).digest('hex').slice(0, 18).toUpperCase();
  return `GULF${hash}`;
}

function roundPrice(n: number): number {
  return Math.max(0.01, Math.round(n * 100) / 100);
}
