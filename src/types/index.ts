export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";
export type PriorityLevel = "HIGH" | "MEDIUM" | "LOW";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  healthScore: number;
}

export interface KPIMetric {
  title: string;
  value: number;
  formattedValue: string;
  changePercent?: number;
  trend?: "up" | "down" | "neutral";
  subtitle?: string;
  iconName: string;
}

export interface TransactionItem {
  id: string;
  date: string;
  merchant: string;
  description: string;
  category: string;
  account: string;
  type: TransactionType;
  amount: number;
  isRecurring?: boolean;
}

export interface ExpenseCategoryItem {
  name: string;
  amount: number;
  percentage: number;
  color: string;
  isEssential: boolean;
}

export interface CashFlowPoint {
  month: string;
  income: number;
  expenses: number;
  projectedBalance: number;
}

export interface GoalItem {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  monthlyContribution: number;
  targetDate: string;
  category: string;
  color: string;
}

export interface LiabilityItem {
  id: string;
  name: string;
  outstanding: number;
  interestRate: number;
  emi: number;
  minimumDue?: number;
  type: string;
  recommendationNote?: string;
}

export interface SubscriptionItem {
  id: string;
  name: string;
  amount: number;
  billingCycle: "monthly" | "yearly";
  nextBilling: string;
  category: string;
  isDetectedRecently?: boolean;
  status: "active" | "flagged" | "saving_opportunity";
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  priority: PriorityLevel;
  type: "overspending" | "large_transaction" | "emi_due" | "subscription_renewal" | "low_cash_buffer";
  date: string;
  actionUrl?: string;
}

export interface AIInsightItem {
  id: string;
  title: string;
  description: string;
  category: "warning" | "tip" | "opportunity";
  impact: string;
  icon: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  text: string;
  timestamp: string;
  suggestedActions?: string[];
}

export interface WhatIfScenario {
  id: string;
  name: string;
  description: string;
  deltaIncome: number;
  deltaExpense: number;
  newEMI: number;
  goalDelayMonths: number;
}
