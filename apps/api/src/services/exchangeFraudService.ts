import { Trade } from '../database/models/Trade';
import { Order } from '../database/models/Order';
import { ListedCompany } from '../database/models/ListedCompany';
import { LARGE_TRADE_THRESHOLD } from '../constants/exchange';

export async function detectFraud(params: {
  userId: string;
  stockId: string;
  side: 'buy' | 'sell';
  quantity: number;
  total: number;
  companyId: string;
}): Promise<string[]> {
  const flags: string[] = [];
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [recentOpposite, washPattern, listed] = await Promise.all([
    Trade.findOne({
      userId: params.userId,
      stockId: params.stockId,
      side: params.side === 'buy' ? 'sell' : 'buy',
      executedAt: { $gte: hourAgo },
    }),
    Trade.aggregate([
      { $match: { userId: params.userId, stockId: params.stockId, executedAt: { $gte: hourAgo } } },
      { $group: { _id: '$side', count: { $sum: 1 }, volume: { $sum: '$quantity' } } },
    ]),
    ListedCompany.findOne({ companyId: params.companyId }),
  ]);

  if (recentOpposite) flags.push('rapid_reversal');
  if (washPattern.length >= 2 && washPattern.every((p) => p.count >= 2)) flags.push('wash_trading');
  if (params.total >= LARGE_TRADE_THRESHOLD) flags.push('large_transaction');
  if (listed?.ownerUserId?.toString() === params.userId) flags.push('insider_trading_risk');

  const pendingSame = await Order.countDocuments({
    userId: params.userId,
    stockId: params.stockId,
    side: params.side,
    status: { $in: ['pending', 'partial'] },
  });
  if (pendingSame > 5) flags.push('order_spam');

  return flags;
}

export async function getFraudAlerts(limit = 50) {
  return Trade.find({ suspicious: true }).sort({ executedAt: -1 }).limit(limit);
}
