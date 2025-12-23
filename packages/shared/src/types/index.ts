// 공통 타입 정의

import { AllergyType, DietType, SafetyLevel } from '../constants';

// 사용자 프로필
export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  allergies: AllergyType[];
  diets: DietType[];
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

// 스캔 결과
export interface ScanResult {
  barcode: string;
  format: string;
  productName?: string;
  ingredients?: string[];
  allergens?: AllergyType[];
  safetyLevel: SafetyLevel;
  scannedAt: Date;
}

// 제품 정보
export interface Product {
  id: string;
  barcode: string;
  name: string;
  manufacturer?: string;
  ingredients: string[];
  allergens: AllergyType[];
  nutritionInfo?: NutritionInfo;
  imageUrl?: string;
}

// 영양 정보
export interface NutritionInfo {
  servingSize: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  sodium: number;
  sugar?: number;
  fiber?: number;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// 페이지네이션
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
