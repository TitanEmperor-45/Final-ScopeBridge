export interface UserGuideSectionItem {
  title: string;
  roleOrScope: string;
  steps: string[];
  keyLinksOrEndpoints?: string[];
}

export interface UserGuideChapter {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  summary: string;
  items: UserGuideSectionItem[];
}

export const OFFICIAL_PLATFORM_LINKS = {
  platformName: 'ScopeBridg Global & Executive Stays',
  supportCenterLabel: '24/7 In-App Concierge & Help Desk',
  partnerNetworkLabel: 'Certified Hospitality & Maintenance Partner Network',
};

export const USER_GUIDE_CHAPTERS: UserGuideChapter[] = [
  {
    id: 'getting_started',
    number: '01',
    title: 'Getting Started & Creating Your Profile',
    subtitle: 'Simple account sign-in, profile registration, and workspace navigation',
    summary:
      'Welcome to ScopeBridg Global & Executive Stays. Whether you are booking a luxury stay, hosting a residence, providing certified childcare, or driving executive shuttles, getting started takes less than a minute.',
    items: [
      {
        title: '1. Signing In & Selecting Your Workspace',
        roleOrScope: 'All Users',
        steps: [
          'Sign In Tab: Enter your registered username or email address and password on the welcome screen to open your personalized dashboard.',
          'Login Kiosk Mode: Reception staff and property hosts can sign directly into the touchscreen Lobby Kiosk Mode for on-site guest check-ins and walk-in reservations.',
          'Role Switcher & Navigation: Use the top navigation bar to switch between Stays, Calendar & Planner, Virtual Wallet, Trips, and Support.',
        ],
      },
      {
        title: '2. Registering a New Account',
        roleOrScope: 'New Guests, Hosts & Service Partners',
        steps: [
          'Choose Your Profile Category: Open the "Register Profile" tab and select the account type that matches your needs (Guest / Traveller, Property Owner / Host, Certified Super Nanny, or Executive Shuttle Chauffeur).',
          'Complete Your Details: Enter your full name, preferred username, email address, phone number, and search for your city or location when prompted.',
          'Select Preferred Travel Channels & Avatar: Pick your preferred booking channels and profile avatar, set your password, and click "Create Profile & Sign In Instantly".',
        ],
      },
    ],
  },
  {
    id: 'guest_booking_experience',
    number: '02',
    title: 'Searching & Booking Executive Stays (Guest Experience)',
    subtitle: 'How to discover residences, filter amenities, plan holidays, and book rooms',
    summary:
      'Guests can explore verified residences worldwide, compare individual rooms and suites, plan multi-stop itineraries on an interactive calendar, or submit custom room rate offers.',
    items: [
      {
        title: '1. Destination Search & Smart Amenity Filters',
        roleOrScope: 'Guest Stay Portal',
        steps: [
          'Search by Destination or Suburb: Use the search bar to look up any city, suburb, or residence name. Address and location fields remain clean until you search and select your destination.',
          'Filter by Lifestyle & Comfort: Toggle filters for Backup Solar Power, High-Speed Wi-Fi, Self Check-In, Free Parking, Full Kitchen, Pet-Friendly, and Family-Friendly residences.',
          'Interactive Map & Gallery View: Switch between the photo grid and interactive map view to compare neighborhood proximity to shopping, dining, business hubs, and transit.',
        ],
      },
      {
        title: '2. Interactive Calendar, Room Selection & Price Bidding',
        roleOrScope: 'Flexible Booking Options',
        steps: [
          'Select Dates & Calculate Nights Automatically: Pick your check-in and check-out dates on the interactive calendar; the stay duration and total accommodation rate calculate automatically.',
          'Choose Individual Suites or Entire Residences: Browse room-level photos, bed configurations, and weekday or weekend rates before confirming your selection.',
          'Bid on a Room Rate: Planning a longer stay? Click "Bid on Room Rate" on any residence to propose your preferred nightly budget directly to the host for review.',
        ],
      },
    ],
  },
  {
    id: 'checkout_wallet_checkin',
    number: '03',
    title: 'Secure Checkout, Virtual Wallet & Keyless Self Check-In',
    subtitle: 'Seamless payment confirmation, holiday wallet rewards, and smart door access',
    summary:
      'Enjoy transparent pricing, one-time passcode payment verification, cashback rewards in your Virtual Holiday Wallet, and effortless keyless arrival.',
    items: [
      {
        title: '1. Custom Stay Add-Ons & Secure OTP Verification',
        roleOrScope: 'Checkout Experience',
        steps: [
          'Personalize Your Stay: Add optional Airport Chauffeur Pickup, Fresh Breakfast Baskets, or Late Check-Out during your reservation.',
          'Choose Your Preferred Payment Method: Select from instant card payment, instant EFT, or your Virtual Holiday Wallet balance.',
          'One-Time Passcode (OTP) Confirmation: Enter the 6-digit verification code sent to your notification feed to confirm your reservation and generate your instant booking receipt.',
        ],
      },
      {
        title: '2. Virtual Holiday Wallet & Keyless Smart Lock Arrival',
        roleOrScope: 'Rewards & Arrival Access',
        steps: [
          'Virtual Holiday Wallet: Save toward upcoming trips, earn cashback rewards on direct bookings, and apply referral credits toward accommodation or concierge services.',
          'Digital Access Pass & Smart Lock PIN: Once confirmed, open "My Trips & Access Codes" to view your unique smart door lock PIN, lockbox code, parking bay, and Wi-Fi credentials.',
          'Express Check-Out: At the end of your stay, complete a 1-click check-out from your phone or the lobby kiosk to notify the housekeeping team.',
        ],
      },
    ],
  },
  {
    id: 'nanny_and_shuttle_concierge',
    number: '04',
    title: 'Family Childcare & Executive Chauffeur Concierge',
    subtitle: 'On-demand vetted nannies and private airport & city transfers',
    summary:
      'Travel with complete peace of mind by booking certified early childhood caregivers and professional executive chauffeurs directly from your guest dashboard.',
    items: [
      {
        title: '1. Smart Nanny Matcher & Live Childcare Activity Feed',
        roleOrScope: 'Childcare-on-Call',
        steps: [
          'Smart Qualification Matcher: Filter and match caregivers by shift duration (from 2-hour errands to overnight care), spoken languages, infant/toddler specialties, and First Aid/CPR certifications.',
          'Book a Care Session: Select your preferred nanny, confirm your suite, date, children ages, and any dietary or allergy notes.',
          'Real-Time Parent Updates: Follow live timestamped updates logged by your caregiver during the shift, including meals, story time, creative play, and rest checks.',
        ],
      },
      {
        title: '2. Executive Airport Shuttle & Point-to-Point Chauffeurs',
        roleOrScope: 'Executive Chauffeur Service',
        steps: [
          'Select Vehicle Class & Service Type: Choose between Airport Meet & Greet Transfers, City Point-to-Point Rides, or Hourly Chauffeur Hire.',
          'Search Pickup & Destination Locations: Search and select your pickup terminal or address and your destination property, then add your flight number for automatic delay tracking.',
          'Live Trip Status: Track your chauffeur from Scheduled to En Route, Arrived, and Completed.',
        ],
      },
    ],
  },
  {
    id: 'host_portfolio_experience',
    number: '05',
    title: 'Property Host & Portfolio Management Experience',
    subtitle: 'Tools for property owners to manage listings, pricing, quotes, and turnovers',
    summary:
      'Property Owners have a dedicated workspace to showcase residences, adjust seasonal rates, respond to guest inquiries, issue quotations and invoices, and coordinate housekeeping.',
    items: [
      {
        title: '1. Listing Residences, Rooms & Dynamic Pricing',
        roleOrScope: 'Property Owner Portal',
        steps: [
          'Add & Customize Properties: Upload high-resolution photos and walkthrough videos, search and select your property address, and set check-in instructions.',
          'Room-by-Room Configuration: Add individual suites with custom weekday, weekend, and corporate rates, and apply smart seasonal pricing suggestions.',
          'Multi-Channel Calendar Sync: View all upcoming reservations, blocked maintenance dates, and holiday schedules on a unified daily, weekly, or monthly calendar.',
        ],
      },
      {
        title: '2. Guest Quotations, Tax Invoices & Housekeeping Turnovers',
        roleOrScope: 'Host Operations & Billing',
        steps: [
          'Create Quotations & Invoices: Generate itemized guest quotations for corporate or extended stays and convert approved quotes into downloadable tax invoices in one click.',
          'Manage Room Bids: Review custom nightly rate offers from prospective guests and accept, counter-offer, or decline with a single click.',
          'Housekeeping & Maintenance Checklists: Track post-checkout room cleaning checklists and schedule certified property maintenance artisans when needed.',
        ],
      },
    ],
  },
  {
    id: 'kiosk_and_trip_tools',
    number: '06',
    title: 'Lobby Self-Service Kiosk & Smart Travel Tools',
    subtitle: 'Touchscreen reception terminal, local area guides, and trip itinerary planner',
    summary:
      'Enhance the on-property experience with the self-service reception kiosk and built-in destination discovery tools.',
    items: [
      {
        title: '1. Self-Service Lobby Reception Kiosk',
        roleOrScope: 'Lobby Kiosk Mode',
        steps: [
          'Express QR & Booking Reference Check-In: Arriving guests can verify their reservation at the lobby touchscreen and retrieve their room access PIN.',
          'Walk-In Room Reservations: Travellers arriving without a prior booking can browse available suites and book on the spot.',
          'On-Demand Travel Desk: Summon an executive shuttle, request a nanny session, or log a 1-click room check-out directly from the kiosk.',
        ],
      },
      {
        title: '2. Neighborhood Area Guide & Trip Itinerary Planner',
        roleOrScope: 'Guest Concierge Tools',
        steps: [
          'Interactive Area Guide: Search any destination to explore top local restaurants, grocery stores, tourist attractions, transit links, and live weather forecasts.',
          'Custom Trip Planner: Generate personalized day-by-day holiday or business travel itineraries tailored to your group size, budget, and interests.',
          '24/7 Host & Concierge Chat: Reach out anytime via the in-app support chat for assistance with your stay, amenities, or local recommendations.',
        ],
      },
    ],
  },
];

function escapePdfText(str: string): string {
  return str
    .replace(/[^\x20-\x7E]/g, (ch) => {
      if (ch === '•' || ch === '·') return '-';
      if (ch === '—' || ch === '–') return '-';
      if (ch === '“' || ch === '”') return '"';
      if (ch === '’' || ch === '‘') return "'";
      if (ch === '→') return '->';
      return '';
    })
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

function wrapTextLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    if (!current) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

interface PdfLineEntry {
  text: string;
  font: 'F1' | 'F2';
  size: number;
  indent: number;
  spacingBefore: number;
  spacingAfter: number;
  colorRgb?: [number, number, number];
}

export function buildUserGuidePdfBytes(): Uint8Array {
  const entries: PdfLineEntry[] = [];

  entries.push({
    text: 'SCOPEBRIDG GLOBAL & EXECUTIVE STAYS',
    font: 'F2',
    size: 16,
    indent: 45,
    spacingBefore: 0,
    spacingAfter: 6,
    colorRgb: [0.04, 0.45, 0.32],
  });
  entries.push({
    text: 'OFFICIAL CUSTOMER & USER EXPERIENCE GUIDE',
    font: 'F2',
    size: 11,
    indent: 45,
    spacingBefore: 2,
    spacingAfter: 6,
    colorRgb: [0.1, 0.15, 0.25],
  });
  entries.push({
    text: `Edition: ${new Date().toISOString().slice(0, 10)} | Step-by-Step Guide for Guests, Hosts, Nannies, Chauffeurs & Kiosk Users`,
    font: 'F1',
    size: 8.5,
    indent: 45,
    spacingBefore: 0,
    spacingAfter: 10,
    colorRgb: [0.35, 0.4, 0.48],
  });

  for (const chapter of USER_GUIDE_CHAPTERS) {
    entries.push({
      text: `========================================================================================`,
      font: 'F1',
      size: 8,
      indent: 45,
      spacingBefore: 6,
      spacingAfter: 4,
      colorRgb: [0.7, 0.75, 0.8],
    });
    entries.push({
      text: `CHAPTER ${chapter.number}: ${chapter.title.toUpperCase()}`,
      font: 'F2',
      size: 12,
      indent: 45,
      spacingBefore: 2,
      spacingAfter: 4,
      colorRgb: [0.04, 0.45, 0.32],
    });

    for (const line of wrapTextLines(chapter.summary, 92)) {
      entries.push({
        text: line,
        font: 'F1',
        size: 9,
        indent: 45,
        spacingBefore: 0,
        spacingAfter: 3,
        colorRgb: [0.25, 0.3, 0.38],
      });
    }

    for (const item of chapter.items) {
      entries.push({
        text: `${item.title}  [${item.roleOrScope}]`,
        font: 'F2',
        size: 10,
        indent: 45,
        spacingBefore: 6,
        spacingAfter: 3,
        colorRgb: [0.08, 0.12, 0.2],
      });

      for (const step of item.steps) {
        const wrapped = wrapTextLines(`- ${step}`, 88);
        wrapped.forEach((wLine, idx) => {
          entries.push({
            text: wLine,
            font: 'F1',
            size: 8.8,
            indent: idx === 0 ? 55 : 63,
            spacingBefore: 0,
            spacingAfter: 2.5,
            colorRgb: [0.18, 0.22, 0.28],
          });
        });
      }
    }
  }

  const pageTopY = 790;
  const pageBottomY = 55;
  const pagesContentStreams: string[] = [];

  let currentY = pageTopY;
  let currentCommands: string[] = [];

  const startNewPage = () => {
    if (currentCommands.length > 0) {
      pagesContentStreams.push(currentCommands.join('\n'));
    }
    currentCommands = [];
    currentY = pageTopY;
  };

  for (const entry of entries) {
    const neededHeight = entry.spacingBefore + entry.size + entry.spacingAfter;
    if (currentY - neededHeight < pageBottomY) {
      startNewPage();
    }
    currentY -= entry.spacingBefore + entry.size;
    const [r, g, b] = entry.colorRgb || [0.1, 0.1, 0.1];
    currentCommands.push(
      `BT /${entry.font} ${entry.size} Tf ${r.toFixed(2)} ${g.toFixed(2)} ${b.toFixed(2)} rg ${entry.indent} ${currentY.toFixed(1)} Td (${escapePdfText(entry.text)}) Tj ET`
    );
    currentY -= entry.spacingAfter;
  }

  if (currentCommands.length > 0) {
    pagesContentStreams.push(currentCommands.join('\n'));
  }

  const totalPages = pagesContentStreams.length;
  const finalStreams = pagesContentStreams.map((stream, i) => {
    const footer = `BT /F1 8 Tf 0.45 0.50 0.55 rg 45 32 Td (ScopeBridg Global & Executive Stays - Official User Experience Guide | Page ${i + 1} of ${totalPages}) Tj ET`;
    return `${stream}\n${footer}`;
  });

  const objects: string[] = [];
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj');

  const pageObjNums: number[] = [];
  for (let i = 0; i < totalPages; i++) {
    pageObjNums.push(5 + i * 2);
  }
  objects.push(
    `2 0 obj\n<< /Type /Pages /Kids [${pageObjNums.map((n) => `${n} 0 R`).join(' ')}] /Count ${totalPages} >>\nendobj`
  );
  objects.push('3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj');
  objects.push('4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj');

  for (let i = 0; i < totalPages; i++) {
    const pageObjNum = 5 + i * 2;
    const contentObjNum = pageObjNum + 1;
    const streamData = finalStreams[i];
    objects.push(
      `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjNum} 0 R >>\nendobj`
    );
    objects.push(
      `${contentObjNum} 0 obj\n<< /Length ${streamData.length} >>\nstream\n${streamData}\nendstream\nendobj`
    );
  }

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj + '\n';
  }

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (let i = 1; i <= objects.length; i++) {
    const offStr = String(offsets[i]).padStart(10, '0');
    pdf += `${offStr} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  const encoder = new TextEncoder();
  return encoder.encode(pdf);
}

export function downloadUserGuidePdf() {
  const bytes = buildUserGuidePdfBytes();
  const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ScopeBridg_User_Experience_Guide.pdf';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
