'use client';

import { useState } from 'react';
import { SplashScreen } from '@/components/splash-screen';
import { LoginScreen } from '@/components/login-screen';
import { SignupScreen } from '@/components/onboarding/signup-screen';
import { AllergyCategoryScreen } from '@/components/onboarding/allergy-category-screen';
import { AllergyDetailScreen } from '@/components/onboarding/allergy-detail-screen';
import { DietCategoryScreen } from '@/components/onboarding/diet-category-screen';
import { DietDetailScreen } from '@/components/onboarding/diet-detail-screen';
import { HomeDashboard } from '@/components/home-dashboard';
import { CameraScreen } from '@/components/screens/camera-screen';
import { ScanResultSplit } from '@/components/scan-result-split';
import { MenuDetailModal } from '@/components/menu-detail-modal';
import { SafetyCommunicationCard } from '@/components/safety-communication-card';
import { ProfileScreen } from '@/components/profile-screen';
import { SafetyProfileEditScreen } from '@/components/profile/safety-profile-edit-screen';
import { NotificationsScreen } from '@/components/profile/notifications-screen';
import { LanguageSettingsScreen } from '@/components/profile/language-settings-screen';
import { SafetyCardPinScreen } from '@/components/profile/safety-card-pin-screen';
import { HelpSupportScreen } from '@/components/profile/help-support-screen';
import { BottomNav } from '@/components/bottom-nav';
import { Language } from '@/lib/translations';
import { SafetyLevel } from '@/components/common/safety-badge';

type Screen = 
  | 'splash' 
  | 'login' 
  | 'signup' 
  | 'allergyCategory' 
  | 'allergyDetail' 
  | 'dietCategory' 
  | 'dietDetail' 
  | 'home' 
  | 'camera' 
  | 'scan' 
  | 'safetyCard' 
  | 'safetyCardPin'
  | 'myPage'
  | 'safetyProfileEdit'
  | 'notifications'
  | 'languageSettings'
  | 'help';

interface UserProfile {
  allergies: string[];
  diets: string[];
}

interface MenuItem {
  id: string;
  titleKey: string;
  koreanName: string;
  descKey: string;
  safetyStatus: SafetyLevel;
  warningKey?: string;
}

export default function HomePage() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [language, setLanguage] = useState<Language>('en');
  const [userProfile, setUserProfile] = useState<UserProfile>({
    allergies: ['Shrimp', 'Peanuts'],
    diets: ['Vegan'],
  });
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  
  // Onboarding state
  const [allergyCategories, setAllergyCategories] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [dietCategories, setDietCategories] = useState<string[]>([]);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const handleOnboardingComplete = (diets: string[]) => {
    setUserProfile({ allergies: selectedAllergies, diets });
    if (isEditingProfile) {
      setIsEditingProfile(false);
      setCurrentScreen('safetyProfileEdit');
    } else {
      setCurrentScreen('home');
    }
  };

  const handleScanMenu = () => {
    setCurrentScreen('camera');
  };

  const handleCapturePhoto = () => {
    // Simulate camera capture and move to results
    setCurrentScreen('scan');
  };

  const handleBackToHome = () => {
    setCurrentScreen('home');
    setSelectedMenuItem(null);
  };

  const handleTabChange = (tab: Screen) => {
    // If scan tab is clicked, open camera first
    if (tab === 'scan') {
      setCurrentScreen('camera');
    } else {
      setCurrentScreen(tab);
    }
    setSelectedMenuItem(null);
  };

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setCurrentScreen('allergyCategory');
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

  const handleSelectMenuItem = (item: MenuItem) => {
    setSelectedMenuItem(item);
  };

  const handleCloseMenuDetail = () => {
    setSelectedMenuItem(null);
  };

  const handleProfileNavigate = (screen: 'safetyProfileEdit' | 'notifications' | 'languageSettings' | 'help' | 'safetyCard') => {
    if (screen === 'safetyCard') {
      setCurrentScreen('safetyCardPin');
    } else {
      setCurrentScreen(screen);
    }
  };

  const handleLogout = () => {
    setCurrentScreen('login');
  };

  const handlePinCorrect = () => {
    setCurrentScreen('safetyCard');
  };

  const showBottomNav = 
    currentScreen !== 'splash' && 
    currentScreen !== 'login' && 
    currentScreen !== 'signup' && 
    currentScreen !== 'allergyCategory' && 
    currentScreen !== 'allergyDetail' && 
    currentScreen !== 'dietCategory' && 
    currentScreen !== 'dietDetail' && 
    currentScreen !== 'camera' &&
    currentScreen !== 'safetyProfileEdit' &&
    currentScreen !== 'notifications' &&
    currentScreen !== 'languageSettings' &&
    currentScreen !== 'help' &&
    currentScreen !== 'safetyCardPin';

  return (
    <>
      {currentScreen === 'splash' && (
        <SplashScreen
          onComplete={() => setCurrentScreen('login')}
        />
      )}
      
      {currentScreen === 'login' && (
        <LoginScreen
          onLogin={() => setCurrentScreen('signup')}
          onSocialLogin={() => setCurrentScreen('allergyCategory')}
          language={language}
          onLanguageChange={handleLanguageChange}
        />
      )}
      
      {currentScreen === 'signup' && (
        <SignupScreen
          onComplete={() => setCurrentScreen('allergyCategory')}
          onBack={() => setCurrentScreen('login')}
          language={language}
          onLanguageChange={handleLanguageChange}
        />
      )}
      
      {currentScreen === 'allergyCategory' && (
        <AllergyCategoryScreen
          onCategorySelect={(categories) => {
            setAllergyCategories(categories);
            setCurrentScreen('allergyDetail');
          }}
          onBack={() => {
            if (isEditingProfile) {
              setIsEditingProfile(false);
              setCurrentScreen('safetyProfileEdit');
            } else {
              setCurrentScreen('signup');
            }
          }}
          language={language}
          onLanguageChange={handleLanguageChange}
        />
      )}
      
      {currentScreen === 'allergyDetail' && (
        <AllergyDetailScreen
          categories={allergyCategories}
          onAllergySelect={(allergies) => {
            setSelectedAllergies(allergies);
            setCurrentScreen('dietCategory');
          }}
          onBack={() => setCurrentScreen('allergyCategory')}
          language={language}
          onLanguageChange={handleLanguageChange}
        />
      )}
      
      {currentScreen === 'dietCategory' && (
        <DietCategoryScreen
          onCategorySelect={(categories) => {
            setDietCategories(categories);
            setCurrentScreen('dietDetail');
          }}
          onBack={() => setCurrentScreen('allergyDetail')}
          language={language}
          onLanguageChange={handleLanguageChange}
        />
      )}
      
      {currentScreen === 'dietDetail' && (
        <DietDetailScreen
          categories={dietCategories}
          onComplete={handleOnboardingComplete}
          onBack={() => setCurrentScreen('dietCategory')}
          language={language}
          onLanguageChange={handleLanguageChange}
        />
      )}
      
      {currentScreen === 'home' && (
        <HomeDashboard
          onScanMenu={handleScanMenu}
          language={language}
          onLanguageChange={handleLanguageChange}
        />
      )}
      
      {currentScreen === 'camera' && (
        <CameraScreen
          onCapture={handleCapturePhoto}
          onClose={handleBackToHome}
          language={language}
          onCapturePhoto={handleCapturePhoto}
        />
      )}
      
      {currentScreen === 'scan' && (
        <ScanResultSplit
          onBack={handleBackToHome}
          onSelectItem={handleSelectMenuItem}
          language={language}
        />
      )}
      
      {currentScreen === 'myPage' && (
        <ProfileScreen
          userProfile={userProfile}
          onNavigate={handleProfileNavigate}
          language={language}
          onLanguageChange={handleLanguageChange}
          onLogout={handleLogout}
        />
      )}

      {currentScreen === 'safetyProfileEdit' && (
        <SafetyProfileEditScreen
          userProfile={userProfile}
          onBack={() => setCurrentScreen('myPage')}
          onEditAllergies={() => setCurrentScreen('allergyCategory')}
          onEditDiets={() => setCurrentScreen('dietCategory')}
          language={language}
        />
      )}

      {currentScreen === 'notifications' && (
        <NotificationsScreen
          onBack={() => setCurrentScreen('myPage')}
          language={language}
        />
      )}

      {currentScreen === 'languageSettings' && (
        <LanguageSettingsScreen
          currentLanguage={language}
          onBack={() => setCurrentScreen('myPage')}
          onLanguageChange={handleLanguageChange}
        />
      )}

      {currentScreen === 'help' && (
        <HelpSupportScreen
          onBack={() => setCurrentScreen('myPage')}
          language={language}
        />
      )}

      {currentScreen === 'safetyCardPin' && (
        <SafetyCardPinScreen
          onBack={() => setCurrentScreen('myPage')}
          onPinCorrect={handlePinCorrect}
          language={language}
        />
      )}

      {currentScreen === 'safetyCard' && (
        <SafetyCommunicationCard
          userProfile={userProfile}
          language={language}
        />
      )}

      {/* Bottom Navigation */}
      {showBottomNav && (
        <BottomNav
          activeTab={currentScreen as 'home' | 'scan' | 'safetyCard' | 'myPage'}
          onTabChange={handleTabChange}
          language={language}
        />
      )}

      {/* Menu Detail Modal */}
      {selectedMenuItem && (
        <MenuDetailModal
          item={selectedMenuItem}
          onClose={handleCloseMenuDetail}
          language={language}
        />
      )}
    </>
  );
}

