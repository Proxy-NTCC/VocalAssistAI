import React from 'react';

interface LanguageBadgeProps {
  languageCode: string;
}

const languageNames: Record<string, string> = {
  hi: 'Hindi (हिन्दी)',
  ta: 'Tamil (தமிழ்)',
  te: 'Telugu (తెలుగు)',
  kn: 'Kannada (ಕನ್ನಡ)',
  bn: 'Bengali (বাংলা)',
  mr: 'Marathi (मराठी)',
  gu: 'Gujarati (ગુજરાતી)',
  pa: 'Punjabi (ਪੰਜਾਬੀ)',
  ml: 'Malayalam (മലയാളம்)',
  en: 'English',
  hinglish: 'Hinglish'
};

export const LanguageBadge: React.FC<LanguageBadgeProps> = ({ languageCode }) => {
  const code = languageCode.toLowerCase();
  const name = languageNames[code] || languageCode.toUpperCase();
  
  return (
    <span className={`language-badge lang-${code}`}>
      {name}
    </span>
  );
};
