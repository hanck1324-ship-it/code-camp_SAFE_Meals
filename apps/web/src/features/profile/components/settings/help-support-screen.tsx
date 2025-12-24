import {
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Mail,
  FileText,
  Shield,
  MessageCircle,
} from 'lucide-react';
import { Language, translations } from '@/lib/translations';

interface HelpSupportScreenProps {
  onBack: () => void;
  language: Language;
}

export function HelpSupportScreen({
  onBack,
  language,
}: HelpSupportScreenProps) {
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
      answer:
        t.faqAnswer1 ||
        'Our OCR technology has 95%+ accuracy for printed menus in supported languages.',
    },
    {
      question: t.faqQuestion2 || 'Can I use this app offline?',
      answer:
        t.faqAnswer2 ||
        'Menu scanning requires an internet connection, but your saved safety profile works offline.',
    },
    {
      question: t.faqQuestion3 || 'How do I update my allergies?',
      answer:
        t.faqAnswer3 ||
        'Go to My Profile > Safety Profile > Edit Allergies to update your allergy list.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <div className="border-b border-gray-200 bg-white px-6 pb-4 pt-8">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="-ml-2 flex h-10 w-10 items-center justify-center"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h2>{t.helpSupport}</h2>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6 px-6 py-6">
        {/* Quick Links */}
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          {helpItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                className="flex w-full items-center gap-4 border-b border-gray-100 p-4 transition-colors last:border-b-0 hover:bg-gray-50"
              >
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${item.color}15` }}
                >
                  <Icon className="h-6 w-6" style={{ color: item.color }} />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.subtitle}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 flex-shrink-0 text-gray-400" />
              </button>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div>
          <h3 className="mb-3 px-2">
            {t.commonQuestions || 'Common Questions'}
          </h3>
          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <h4 className="mb-2">{item.question}</h4>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Card */}
        <div className="rounded-3xl border border-[#2ECC71]/20 bg-gradient-to-br from-[#2ECC71]/10 to-[#2ECC71]/5 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#2ECC71]">
              <Mail className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="mb-1">{t.needMoreHelp || 'Need More Help?'}</h3>
              <p className="mb-3 text-sm text-muted-foreground">
                {t.contactUsDesc || 'Our support team is here to help you'}
              </p>
              <a
                href="mailto:support@safemeals.app"
                className="text-sm font-medium text-[#2ECC71]"
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
