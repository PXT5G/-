import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { Company, type ICompany, type ICompanyBankTransaction } from '../database/models/Company';

function txnId() {
  return `TXN-${uuidv4().slice(0, 10).toUpperCase()}`;
}

export function generateIBAN(companyId: string): string {
  const hash = crypto.createHash('sha256').update(companyId).digest('hex').slice(0, 18).toUpperCase();
  return `GULF${hash}`;
}

export function generateWalletId(companyId: string): string {
  return `WLT-${companyId.replace('CO-', '')}-${uuidv4().slice(0, 6).toUpperCase()}`;
}

export function generateBankAccountNumber(companyId: string): string {
  const seq = companyId.replace(/\D/g, '').padStart(8, '0').slice(-8);
  return `4820${seq}${crypto.randomInt(1000, 9999)}`;
}

export function provisionCompanyBanking(companyId: string) {
  return {
    iban: generateIBAN(companyId),
    walletId: generateWalletId(companyId),
    bankAccountNumber: generateBankAccountNumber(companyId),
    cashBalance: 0,
    availableBalance: 0,
    frozenBalance: 0,
    payrollAccountBalance: 0,
    taxAccountBalance: 0,
    loanAccountBalance: 0,
    bankTransactions: [] as ICompanyBankTransaction[],
  };
}

type AccountType = 'main' | 'payroll' | 'tax' | 'loan';

function getAccountBalance(company: ICompany, account: AccountType): number {
  switch (account) {
    case 'payroll': return company.payrollAccountBalance;
    case 'tax': return company.taxAccountBalance;
    case 'loan': return company.loanAccountBalance;
    default: return company.availableBalance;
  }
}

function setAccountBalance(company: ICompany, account: AccountType, amount: number) {
  switch (account) {
    case 'payroll': company.payrollAccountBalance = amount; break;
    case 'tax': company.taxAccountBalance = amount; break;
    case 'loan': company.loanAccountBalance = amount; break;
    default:
      company.availableBalance = amount;
      company.cashBalance = amount + company.frozenBalance;
  }
}

async function recordTransaction(
  company: ICompany,
  params: {
    type: ICompanyBankTransaction['type'];
    amount: number;
    account: AccountType;
    description: string;
    reference?: string;
    counterparty?: string;
  }
) {
  const balanceAfter = getAccountBalance(company, params.account);
  const transaction: ICompanyBankTransaction = {
    transactionId: txnId(),
    type: params.type,
    amount: params.amount,
    balanceAfter,
    account: params.account,
    description: params.description,
    reference: params.reference,
    counterparty: params.counterparty,
    createdAt: new Date(),
  };
  company.bankTransactions.unshift(transaction);
  if (company.bankTransactions.length > 500) {
    company.bankTransactions = company.bankTransactions.slice(0, 500);
  }
  return transaction;
}

export async function deposit(
  companyId: string,
  amount: number,
  description: string,
  account: AccountType = 'main',
  reference?: string
) {
  if (amount <= 0) throw new Error('INVALID_AMOUNT');
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');

  const newBalance = getAccountBalance(company, account) + amount;
  setAccountBalance(company, account, newBalance);
  const txn = await recordTransaction(company, {
    type: 'incoming',
    amount,
    account,
    description,
    reference,
  });
  await company.save();
  return { transaction: txn, balance: newBalance, iban: company.iban };
}

export async function withdraw(
  companyId: string,
  amount: number,
  description: string,
  account: AccountType = 'main',
  reference?: string
) {
  if (amount <= 0) throw new Error('INVALID_AMOUNT');
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');

  const current = getAccountBalance(company, account);
  if (current < amount) throw new Error('INSUFFICIENT_FUNDS');

  const newBalance = current - amount;
  setAccountBalance(company, account, newBalance);
  const txn = await recordTransaction(company, {
    type: 'outgoing',
    amount,
    account,
    description,
    reference,
  });
  await company.save();
  return { transaction: txn, balance: newBalance };
}

export async function transferBetweenAccounts(
  companyId: string,
  from: AccountType,
  to: AccountType,
  amount: number,
  description: string
) {
  if (amount <= 0) throw new Error('INVALID_AMOUNT');
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');

  const fromBalance = getAccountBalance(company, from);
  if (fromBalance < amount) throw new Error('INSUFFICIENT_FUNDS');

  setAccountBalance(company, from, fromBalance - amount);
  setAccountBalance(company, to, getAccountBalance(company, to) + amount);

  const txn = await recordTransaction(company, {
    type: 'transfer',
    amount,
    account: from,
    description: `Transfer to ${to}: ${description}`,
  });
  await company.save();
  return { transaction: txn, fromBalance: getAccountBalance(company, from), toBalance: getAccountBalance(company, to) };
}

export async function freezeFunds(companyId: string, amount: number, reason: string) {
  if (amount <= 0) throw new Error('INVALID_AMOUNT');
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  if (company.availableBalance < amount) throw new Error('INSUFFICIENT_FUNDS');

  company.availableBalance -= amount;
  company.frozenBalance += amount;
  company.cashBalance = company.availableBalance + company.frozenBalance;
  const txn = await recordTransaction(company, {
    type: 'freeze',
    amount,
    account: 'main',
    description: reason,
  });
  await company.save();
  return { transaction: txn, frozenBalance: company.frozenBalance, availableBalance: company.availableBalance };
}

export async function unfreezeFunds(companyId: string, amount: number, reason: string) {
  if (amount <= 0) throw new Error('INVALID_AMOUNT');
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  if (company.frozenBalance < amount) throw new Error('INSUFFICIENT_FROZEN');

  company.frozenBalance -= amount;
  company.availableBalance += amount;
  company.cashBalance = company.availableBalance + company.frozenBalance;
  const txn = await recordTransaction(company, {
    type: 'unfreeze',
    amount,
    account: 'main',
    description: reason,
  });
  await company.save();
  return { transaction: txn, frozenBalance: company.frozenBalance, availableBalance: company.availableBalance };
}

export async function getBankSummary(companyId: string) {
  const company = await Company.findOne({ companyId, deletedAt: null });
  if (!company) throw new Error('COMPANY_NOT_FOUND');
  return {
    iban: company.iban,
    walletId: company.walletId,
    bankAccountNumber: company.bankAccountNumber,
    cashBalance: company.cashBalance,
    availableBalance: company.availableBalance,
    frozenBalance: company.frozenBalance,
    payrollAccountBalance: company.payrollAccountBalance,
    taxAccountBalance: company.taxAccountBalance,
    loanAccountBalance: company.loanAccountBalance,
    recentTransactions: company.bankTransactions.slice(0, 50),
  };
}

export async function getGulfBankIntegration(userId: string) {
  const { getBankIntegration } = await import('./policeIntegrationService');
  return getBankIntegration(userId);
}
