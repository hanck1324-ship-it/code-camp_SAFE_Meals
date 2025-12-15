import { ChevronLeft, ChevronRight, HelpCircle, Mail, FileText, Shield, MessageCircle } from 'lucide-react';
import { Language, translations } from '../../lib/translations';

interface HelpSupportScreenProps {
  onBack: () => void;
  language: Language;
}

export function HelpSupportScreen({ onBack, language }: HelpSupportScreenProps) {
  const t = translations[language];

  const helpItems = [
    {
      icon: HelpCircle,
      title: t.faq || 'FAQ',
      subtitle: t.faqDesc || 'Frequently asked questions',
      color: '#3B82F6',
    },
    {
      icon: FileText,
      title: t.safetyGuide || 'Safety Guide',
      subtitle: t.safetyGuideDesc || 'How to use SafeMeals effectively',
      color: '#2ECC71',
    },
    {
      icon: Shield,
      title: t.privacyPolicy || 'Privacy Policy',
      subtitle: t.privacyPolicyDesc || 'How we protect your data',
      color: '#8B5CF6',
    },
    {
      icon: MessageCircle,
      title: t.contactSupport || 'Contact Support',
      subtitle: t.contactSupportDesc || 'Get help from our team',
      color: '#F59E0B',
    },
  ];

  const faqItems = [
    {
      question: t.faqQuestion1 || 'How accurate is the OCR scanning?',
      answer: t.faqAnswer1 || 'Our OCR technology has 95%+ accuracy for printed menus in supported languages.',
    },
    {
      question: t.faqQuestion2 || 'Can I use this app offline?',
      answer: t.faqAnswer2 || 'Menu scanning requires an internet connection, but your saved safety profile works offline.',
    },
    {
      question: t.faqQuestion3 || 'How do I update my allergies?',
      answer: t.faqAnswer3 || 'Go to My Profile > Safety Profile > Edit Allergies to update your allergy list.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="px-6 pt-8 pb-4 bg-white border-b border-gray-200">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 flex items-center justify-center -ml-2">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h2>{t.helpSupport}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6 space-y-6">
        {/* Quick Links */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          {helpItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Icon className="w-6 h-6" style={{ color: item.color }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div>
          <h3 className="mb-3 px-2">{t.commonQuestions || 'Common Questions'}</h3>
          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
              >
                <h4 className="mb-2">{item.question}</h4>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Card */}
        <div className="bg-gradient-to-br from-[#2ECC71]/10 to-[#2ECC71]/5 rounded-3xl p-6 border border-[#2ECC71]/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-[#2ECC71] rounded-full flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="mb-1">{t.needMoreHelp || 'Need More Help?'}</h3>
              <p className="text-sm text-muted-foreground mb-3">
                {t.contactUsDesc || 'Our support team is here to help you'}
              </p>
              <a
                href="mailto:support@safemeals.app"
                className="text-sm text-[#2ECC71] font-medium"
              >
                support@safemeals.app
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
