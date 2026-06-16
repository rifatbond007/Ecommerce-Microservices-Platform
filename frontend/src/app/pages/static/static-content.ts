export interface StaticContent {
  title: string;
  subtitle: string;
  sections: { heading: string; body: string }[];
}

export const staticContent: Record<string, StaticContent> = {
  about: {
    title: 'About Us',
    subtitle: 'Our Story',
    sections: [
      {
        heading: 'Who We Are',
        body: 'Market is a premium e-commerce platform built for people who value quality, simplicity, and thoughtful design. We curate products that meet exacting standards, so you can shop with confidence.',
      },
      {
        heading: 'Our Mission',
        body: 'We believe online shopping should be straightforward, transparent, and even enjoyable. Every decision we make — from product selection to packaging — is guided by a commitment to craft and customer delight.',
      },
      {
        heading: 'Why Market',
        body: 'Thousands of customers trust Market for our curated selection, reliable shipping, and hassle-free returns. We obsess over the details so you can focus on finding what you love.',
      },
    ],
  },
  careers: {
    title: 'Careers',
    subtitle: 'Join Our Team',
    sections: [
      {
        heading: 'Work With Us',
        body: 'We are a small, focused team building the future of e-commerce. If you value ownership, craftsmanship, and continuous learning, you will fit right in.',
      },
      {
        heading: 'Our Culture',
        body: 'We work in small teams with real ownership. Every engineer ships to production, participates in design decisions, and is expected to grow beyond their starting role.',
      },
      {
        heading: 'Open Positions',
        body: 'We are currently hiring for engineering, design, and operations roles in Dhaka, Bangladesh. Remote-friendly for exceptional candidates. Send your resume to careers@market.com.',
      },
    ],
  },
  contact: {
    title: 'Contact',
    subtitle: 'Get In Touch',
    sections: [
      {
        heading: 'Email',
        body: 'For general inquiries: support@market.com\nFor press inquiries: press@market.com\nFor partnerships: partners@market.com',
      },
      {
        heading: 'Phone',
        body: 'Customer support: 1-800-MARKET\nMonday through Friday, 9 AM — 6 PM EST',
      },
      {
        heading: 'Location',
        body: 'Market Inc.\n123 Commerce Street\nDhaka, Bangladesh',
      },
    ],
  },
  help: {
    title: 'Help Center',
    subtitle: 'How Can We Help?',
    sections: [
      {
        heading: 'Getting Started',
        body: 'Create an account, browse our curated collections, and add items to your cart. Checkout is fast and secure. Track your order from the Orders page in your profile.',
      },
      {
        heading: 'Payment Methods',
        body: 'We accept Visa, Mastercard, American Express, and PayPal. All payments are processed securely through industry-standard encryption.',
      },
      {
        heading: 'Order Issues',
        body: 'If you encounter any issues with your order, contact us within 48 hours of delivery. Our support team typically responds within 24 hours.',
      },
    ],
  },
  shipping: {
    title: 'Shipping Info',
    subtitle: 'Delivery Details',
    sections: [
      {
        heading: 'Shipping Times',
        body: 'Standard shipping takes 5-7 business days within Bangladesh. Express shipping is available at checkout for 2-3 business day delivery. International orders take 10-14 business days.',
      },
      {
        heading: 'Shipping Costs',
        body: 'Free standard shipping on all orders over $50. Express shipping starts at $12. International shipping rates are calculated at checkout.',
      },
      {
        heading: 'Tracking',
        body: 'Once your order ships, you will receive a tracking number via email. You can also track orders from your account dashboard.',
      },
    ],
  },
  returns: {
    title: 'Returns',
    subtitle: 'Easy Returns Policy',
    sections: [
      {
        heading: '30-Day Return Policy',
        body: 'We accept returns within 30 days of delivery. Items must be unused, in original packaging, with all tags attached. Refunds are processed within 5-7 business days of receiving the return.',
      },
      {
        heading: 'How to Return',
        body: 'Go to your Orders page, select the item you want to return, and follow the instructions. We will email you a prepaid return label. Drop the package at any designated shipping location.',
      },
      {
        heading: 'Exchanges',
        body: 'We do not offer direct exchanges. Please return the unwanted item for a full refund and place a new order for the desired item. This ensures the fastest possible processing.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    subtitle: 'Your Data Matters',
    sections: [
      {
        heading: 'Information We Collect',
        body: 'We collect only the information necessary to process your orders and improve your experience: name, email, shipping address, payment information (processed securely by our payment partners), and browsing behavior on our site.',
      },
      {
        heading: 'How We Use It',
        body: 'Your information is used to fulfill orders, communicate order status, send promotional emails (with consent), and improve our product recommendations. We never sell your personal data to third parties.',
      },
      {
        heading: 'Your Rights',
        body: 'You can access, update, or delete your account data at any time from your profile settings. Contact us at privacy@market.com for data requests or concerns.',
      },
    ],
  },
  terms: {
    title: 'Terms of Service',
    subtitle: 'Terms & Conditions',
    sections: [
      {
        heading: 'Acceptance of Terms',
        body: 'By using Market, you agree to these terms. If you do not agree, please do not use our services. We reserve the right to update these terms at any time; continued use constitutes acceptance of changes.',
      },
      {
        heading: 'Account Responsibilities',
        body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Notify us immediately of any unauthorized use.',
      },
      {
        heading: 'Limitation of Liability',
        body: 'Market is not liable for indirect, incidental, or consequential damages arising from the use of our platform. Our total liability is limited to the amount paid for the products in question.',
      },
    ],
  },
};
