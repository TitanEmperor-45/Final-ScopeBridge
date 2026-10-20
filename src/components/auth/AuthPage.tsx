import React, { useState } from 'react';
import { AppRole, UserAccount, Property, Booking, CalendarPlanEvent, ChannelConfig, BankAccountDetails } from '../../types';
import { PRODUCTION_SUPER_ADMIN } from '../../data/usersData';
import { ALL_GLOBAL_AREAS } from '../../data/globalAreas';
import { IS_DEV, IS_PROD } from '../../lib/env';
import { UniversalCalendarPlanner } from '../common/UniversalCalendarPlanner';
import { ProfileBankAccountsManager } from '../common/ProfileBankAccountsManager';
import pandaFamilyAvatar from '../../assets/images/panda_family_cubs_1789920270586.jpg';
import {
  ShieldCheck,
  Building2,
  User,
  Baby,
  Car,
  KeyRound,
  Lock,
  Mail,
  Phone,
  UserPlus,
  LogIn,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Briefcase,
  Landmark,
  HeartHandshake,
  GraduationCap,
  Trash2,
  Edit3,
  PauseCircle,
  Ban,
  Save,
  X,
  FileText,
  Download,
  BookOpen,
  Calendar as CalendarIcon,
  Link2,
  ExternalLink,
  Sparkles,
  Send,
  Monitor,
  Users,
  Search,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { UserGuideModal } from '../common/UserGuideModal';
import { downloadUserGuidePdf } from '../../utils/userGuidePdfGenerator';

interface AuthPageProps {
  currentUser: UserAccount;
  onLoginSuccess: (user: UserAccount, isDevTestSwitch?: boolean) => void;
  onLoginToKioskMode?: (user: UserAccount) => void;
  onRegisterUser: (newUser: UserAccount) => void;
  onUpdateUser?: (updatedUser: UserAccount) => void;
  onDeleteUser?: (userId: string) => void;
  onUpdateUserStatus?: (userId: string, status: UserAccount['status']) => void;
  registeredUsers: UserAccount[];
  onBackToApp: () => void;
  onLogout?: () => void;
  properties?: Property[];
  bookings?: Booking[];
  calendarEvents?: CalendarPlanEvent[];
  channels?: ChannelConfig[];
  onBookProperty?: (bookingData: Omit<Booking, 'id' | 'createdAt'>) => void;
  onUpdateBookings?: React.Dispatch<React.SetStateAction<Booking[]>>;
  onUpdateCalendarEvents?: React.Dispatch<React.SetStateAction<CalendarPlanEvent[]>>;
  onUpdateProperties?: React.Dispatch<React.SetStateAction<Property[]>>;
  onOpenGuestBookingLink?: () => void;
  showToast?: (msg: string) => void;
}

const AVATAR_OPTIONS = [
  pandaFamilyAvatar,
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
];

export interface RegistrationCategory {
  id: string;
  role: AppRole;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  regFee: string;
  monthlyFee: string;
  desc: string;
  defaultTitle: string;
  badgeTag: string;
}

export const REG_CATEGORIES: RegistrationCategory[] = [
  {
    id: 'guest',
    role: 'guest',
    label: 'Guest or Traveller',
    icon: User,
    regFee: 'R 0.00',
    monthlyFee: 'R 0.00',
    desc: 'Book stays & tours',
    defaultTitle: 'Verified Global Traveler',
    badgeTag: 'Free Traveller Tier',
  },
  {
    id: 'owner',
    role: 'owner',
    label: 'Property Owner',
    icon: Building2,
    regFee: 'R 1,500',
    monthlyFee: 'R 500',
    desc: 'Manage & list portfolio',
    defaultTitle: 'Property Host & Asset Owner',
    badgeTag: 'Host & Property Partner',
  },
  {
    id: 'nanny',
    role: 'nanny',
    label: 'Super Nanny',
    icon: Baby,
    regFee: 'R 300',
    monthlyFee: 'R 80',
    desc: 'Childcare & shifts',
    defaultTitle: 'Certified Childcare Specialist',
    badgeTag: 'Certified Childcare Provider',
  },
  {
    id: 'driver',
    role: 'driver',
    label: 'Shuttle Driver',
    icon: Car,
    regFee: 'R 400',
    monthlyFee: 'R 150',
    desc: 'Airport transfers & fleet',
    defaultTitle: 'Executive VIP Chauffeur',
    badgeTag: 'Verified Fleet Chauffeur',
  },
  {
    id: 'private_company',
    role: 'owner',
    label: 'Private Companies',
    icon: Briefcase,
    regFee: 'R 4,000',
    monthlyFee: 'R 1,800',
    desc: 'Corporate & staff stays',
    defaultTitle: 'Corporate Enterprise Member',
    badgeTag: 'Private Company Account',
  },
  {
    id: 'government',
    role: 'owner',
    label: 'Government Entities',
    icon: Landmark,
    regFee: 'R 3,500',
    monthlyFee: 'R 1,500',
    desc: 'Public sector lodging',
    defaultTitle: 'Government & Public Sector Entity',
    badgeTag: 'Government Entity Account',
  },
  {
    id: 'npc_ngo',
    role: 'owner',
    label: 'NPC / NGO / Churches',
    icon: HeartHandshake,
    regFee: 'R 2,500',
    monthlyFee: 'R 1,200',
    desc: 'Non-profit & faith orgs',
    defaultTitle: 'Non-Profit & Faith Entity Lead',
    badgeTag: 'NPC / NGO / Faith Account',
  },
  {
    id: 'education',
    role: 'owner',
    label: 'Education / Schools',
    icon: GraduationCap,
    regFee: 'R 1,300 – R 5,000',
    monthlyFee: 'R 800 – R 1,300',
    desc: 'Schools & Institutes',
    defaultTitle: 'Educational Institute Partner',
    badgeTag: 'Educational Institute Account',
  },
];

const ACTIVE_DIRECTORY_USERS: UserAccount[] = [
  {
    id: 'superadmin-01',
    name: 'Platform Super Administrator',
    fullName: 'Platform Super Administrator',
    username: 'superadmin',
    password: 'SuperAdmin@2026!',
    role: 'super_admin',
    email: 'nightscope58@gmail.com',
    phone: '+27 69 497 7018',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    title: 'Executive Super Administrator & Platform Lead',
    status: 'active'
  },
  {
    id: 'guest-abonde',
    name: 'Abonde',
    fullName: 'Abonde',
    username: 'Abonde',
    password: 'Guest@2026!',
    role: 'guest',
    email: 'abonde@gmail.com',
    phone: '+27 69 497 7018',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    title: 'VIP Direct Guest',
    status: 'active'
  },
  {
    id: 'guest-themba',
    name: 'Themba Nxumalo',
    fullName: 'Themba Nxumalo',
    username: 'TN',
    password: 'Guest@2026!',
    role: 'guest',
    email: 'themba@gmail.com',
    phone: '+27 69 497 7018',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    title: 'VIP Executive Traveler',
    status: 'active'
  },
  {
    id: 'kiosk-sicelo',
    name: 'Sicelo Nkala',
    fullName: 'Sicelo Nkala',
    username: 'Celoe',
    password: 'Kiosk@2026!',
    role: 'kiosk',
    email: 'sicelo@scopebridg.co.za',
    phone: '+27 69 497 7018',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    title: 'Kiosk Operator',
    status: 'active'
  },
  {
    id: 'kiosk-vanessa',
    name: 'Vanessa Myambose',
    fullName: 'Vanessa Myambose',
    username: 'Nessa',
    password: 'Kiosk@2026!',
    role: 'kiosk',
    email: 'vanessa@scopebridg.co.za',
    phone: '+27 69 497 7018',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    title: 'Kiosk Assistant',
    status: 'active'
  },
  {
    id: 'owner-nhlanhla',
    name: 'Nhlanhla Mdluli',
    fullName: 'Nhlanhla Mdluli',
    username: 'NM',
    password: 'Owner@2026!',
    role: 'owner',
    email: 'nhlanhla@scopebridg.co.za',
    phone: '+27 69 497 7018',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    title: 'Verified Portfolio Host',
    status: 'active'
  },
  {
    id: 'owner-ntsika',
    name: 'The Ntsika T Holdings',
    fullName: 'The Ntsika T Holdings',
    username: 'Ntsika H',
    password: 'Owner@2026!',
    role: 'owner',
    email: 'ntsika@scopebridg.co.za',
    phone: '+27 69 497 7018',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    title: 'Verified Corporate Asset Host',
    status: 'active'
  },
  {
    id: 'guest-mandla',
    name: 'Mandla Lusenga',
    fullName: 'Mandla Lusenga',
    username: 'ML',
    password: 'Guest@2026!',
    role: 'guest',
    email: 'mandla@gmail.com',
    phone: '+27 69 497 7018',
    avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
    title: 'VIP Luxury Guest',
    status: 'active'
  },
  {
    id: 'guest-dumisani',
    name: 'Dumisani Sibandze',
    fullName: 'Dumisani Sibandze',
    username: 'Deez27',
    password: 'Guest@2026!',
    role: 'guest',
    email: 'dumisani@gmail.com',
    phone: '+27 69 497 7018',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    title: 'VIP Corporate Traveler',
    status: 'active'
  },
  {
    id: 'owner-mdluli',
    name: 'Mdluli Nhlanhla',
    fullName: 'Mdluli Nhlanhla',
    username: 'MdluliN',
    password: 'Owner@2026!',
    role: 'owner',
    email: 'mdlulinhlanhla@scopebridg.co.za',
    phone: '+27 69 497 7018',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
    title: 'Verified Portfolio Host & Host Lead',
    status: 'active'
  }
];

export const AuthPage: React.FC<AuthPageProps> = ({
  currentUser,
  onLoginSuccess,
  onLoginToKioskMode,
  onRegisterUser,
  onUpdateUser,
  onDeleteUser,
  onUpdateUserStatus,
  registeredUsers,
  onBackToApp,
  onLogout,
  properties = [],
  bookings = [],
  calendarEvents = [],
  channels = [],
  onBookProperty = () => {},
  onUpdateBookings = () => {},
  onUpdateCalendarEvents = () => {},
  onUpdateProperties = () => {},
  onOpenGuestBookingLink,
  showToast = () => {},
}) => {
  const [activeAuthTab, setActiveAuthTab] = useState<
    'login' | 'kiosk_login' | 'register' | 'calendar' | 'guest_link'
  >('login');

  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<AppRole | ''>('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Kiosk Mode Login Form State (Owners, Admins & Staff created by Owner)
  const [kioskIdentifier, setKioskIdentifier] = useState('');
  const [kioskPassword, setKioskPassword] = useState('');
  const [kioskAccessType, setKioskAccessType] = useState<'owner' | 'admin' | 'staff'>('staff');
  const [showKioskPassword, setShowKioskPassword] = useState(false);
  const [kioskLoginError, setKioskLoginError] = useState<string | null>(null);

  // Register Form State
  const [regCategoryId, setRegCategoryId] = useState<string>('guest');
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('+27 ');
  const [regRole, setRegRole] = useState<AppRole>('guest');
  const [regTitle, setRegTitle] = useState('');
  const [regLocation, setRegLocation] = useState('');
  const [regLocationSearch, setRegLocationSearch] = useState('');
  const [regAvatar, setRegAvatar] = useState(AVATAR_OPTIONS[0]);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regBankAccounts, setRegBankAccounts] = useState<BankAccountDetails[]>([]);
  const [managingProfileBankAccounts, setManagingProfileBankAccounts] = useState<UserAccount | null>(null);

  // BnB Logo, Business Name & Tax Registration Information
  const [regBnbName, setRegBnbName] = useState('ScopeBridg Executive Suites & Residences');
  const [regBnbLogoUrl, setRegBnbLogoUrl] = useState('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=300&q=80');
  const [regVatNumber, setRegVatNumber] = useState('VAT-491029381');
  const [regTaxNumber, setRegTaxNumber] = useState('TAX-90192837');
  const [regBusinessAddress, setRegBusinessAddress] = useState('142 Oxford St & Ferndale on Republic, Johannesburg');

  // Compact Mini Calendar State
  const [miniCalPropertyId, setMiniCalPropertyId] = useState<string>('');
  const [miniCalYear, setMiniCalYear] = useState<number>(2026);
  const [miniCalMonth, setMiniCalMonth] = useState<number>(8); // September by default

  const [regHolidayChannels, setRegHolidayChannels] = useState<string[]>([
    'direct',
    'booking_com',
    'airbnb',
    'lekkeslaap',
    'expedia',
    'vrbo',
    'safarinow',
    'agoda',
    'tripadvisor',
  ]);

  const HOLIDAY_CHANNEL_OPTIONS = [
    { id: 'direct', label: 'ScopeBridg Direct' },
    { id: 'booking_com', label: 'Booking.com' },
    { id: 'airbnb', label: 'Airbnb' },
    { id: 'lekkeslaap', label: 'LekkeSlaap' },
    { id: 'expedia', label: 'Expedia' },
    { id: 'vrbo', label: 'VRBO' },
    { id: 'safarinow', label: 'SafariNow' },
    { id: 'agoda', label: 'Agoda' },
    { id: 'tripadvisor', label: 'TripAdvisor' },
  ];

  // Edit Profile Modal State
  const [editingProfile, setEditingProfile] = useState<UserAccount | null>(null);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState<boolean>(false);
  const [pdfDownloadedToast, setPdfDownloadedToast] = useState<boolean>(false);

  // Forgot Password Modal State
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState<boolean>(false);
  const [resetIdentifierInput, setResetIdentifierInput] = useState<string>('');
  const [resetNewPasswordInput, setResetNewPasswordInput] = useState<string>('');
  const [resetConfirmPasswordInput, setResetConfirmPasswordInput] = useState<string>('');
  const [resetStep, setResetStep] = useState<'request' | 'reset' | 'success'>('request');
  const [resetMsg, setResetMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [matchedUserAccount, setMatchedUserAccount] = useState<UserAccount | null>(null);

  // All combined profiles (always ensure Super Admin is reachable)
  const allProfiles = registeredUsers.some((u) => u.id === PRODUCTION_SUPER_ADMIN.id)
    ? [...registeredUsers]
    : [PRODUCTION_SUPER_ADMIN, ...registeredUsers];

  // Combine standard registered users with default active directory users to ensure maximum compatibility
  const combinedUsers = [...ACTIVE_DIRECTORY_USERS];
  if (registeredUsers && registeredUsers.length > 0) {
    registeredUsers.forEach(ru => {
      if (!combinedUsers.some(u => u.username.toLowerCase() === ru.username.toLowerCase())) {
        combinedUsers.push(ru);
      }
    });
  }

  // Quick fill Super Admin credentials into the login form
  const handleQuickFill = (user: UserAccount) => {
    setLoginIdentifier(user.username);
    setLoginPassword(user.password || 'SuperAdmin@2026!');
    setLoginRole(user.role);
    setLoginError(null);
  };

  // Instant login as a specific profile
  const handleInstantLogin = (user: UserAccount) => {
    onLoginSuccess(user);
    onBackToApp();
  };

  // Submit Login Form
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const cleanId = loginIdentifier.trim().toLowerCase();
    const cleanPw = loginPassword.trim();

    if (!cleanId) {
      setLoginError('Please enter your username or email address.');
      return;
    }

    if (!cleanPw) {
      setLoginError('Please enter your password.');
      return;
    }

    // Match against user list (and support Super Admin & SYSDBA database aliases)
    const isSuperAdminIdentifier =
      cleanId === 'superadmin' ||
      cleanId === 'sysdba' ||
      cleanId === 'nightscope58@gmail.com' ||
      cleanId === 'admin@staysync.co.za';

    const foundUser = isSuperAdminIdentifier
      ? allProfiles.find((u) => u.id === PRODUCTION_SUPER_ADMIN.id || u.role === 'super_admin') || PRODUCTION_SUPER_ADMIN
      : allProfiles.find(
          (u) =>
            u.username.toLowerCase() === cleanId ||
            u.email.toLowerCase() === cleanId ||
            (u.fullName && u.fullName.toLowerCase() === cleanId) ||
            u.name.toLowerCase() === cleanId
        );

    if (!foundUser) {
      setLoginError(
        `No account found matching "${loginIdentifier}". Register a new profile in the Register tab.`
      );
      return;
    }

    // Check password if set (including SYSDBA masterkey)
    const isSuperAdminValidPw =
      foundUser.role === 'super_admin' &&
      (cleanPw === 'SuperAdmin@2026!' ||
        cleanPw === 'masterkey' ||
        cleanPw === 'password123' ||
        cleanPw === foundUser.password);

    if (foundUser.password && foundUser.password !== cleanPw && !isSuperAdminValidPw) {
      setLoginError('Incorrect password. Please verify your credentials.');
      return;
    }

    // Check role if specified
    if (loginRole && foundUser.role !== loginRole) {
      const isAdminPair =
        (foundUser.role === 'admin' || foundUser.role === 'super_admin') &&
        (loginRole === 'admin' || loginRole === 'super_admin');
      if (!isAdminPair) {
        setLoginError(`Account exists but role is ${foundUser.role.toUpperCase()}, not ${loginRole.toUpperCase()}.`);
        return;
      }
    }

    onLoginSuccess(foundUser);
    onBackToApp();
  };

  // Load any Owner-created staff from localStorage so they can log into Kiosk Mode even if created in Owner Portal
  const getOwnerCreatedStaffList = (): any[] => {
    try {
      const sources = [
        localStorage.getItem('scopebridg_owner_staff_kiosk_users'),
        localStorage.getItem('scopebridg_prod_staff_list'),
        localStorage.getItem('ferndalestay_staff_list'),
      ];
      const merged: any[] = [];
      for (const raw of sources) {
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const item of parsed) {
              if (item && !merged.some((m) => m.id === item.id)) {
                merged.push(item);
              }
            }
          }
        }
      }
      return merged;
    } catch {
      return [];
    }
  };

  // Submit Login Kiosk Mode Form (Owners, Admins & Staff Created by Owner)
  const handleKioskLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setKioskLoginError(null);

    const cleanId = kioskIdentifier.trim().toLowerCase();
    const cleanPw = kioskPassword.trim();

    if (!cleanId) {
      setKioskLoginError('Please enter your Owner, Admin, or Owner-created Staff username/email.');
      return;
    }

    if (!cleanPw) {
      setKioskLoginError('Please enter your password.');
      return;
    }

    // 1. Check Super Admin & SYSDBA aliases
    const isSuperAdminIdentifier =
      cleanId === 'superadmin' ||
      cleanId === 'sysdba' ||
      cleanId === 'nightscope58@gmail.com' ||
      cleanId === 'admin@staysync.co.za';

    let matchedAccount: UserAccount | undefined = isSuperAdminIdentifier
      ? allProfiles.find((u) => u.id === PRODUCTION_SUPER_ADMIN.id || u.role === 'super_admin') ||
        PRODUCTION_SUPER_ADMIN
      : allProfiles.find(
          (u) =>
            u.username.toLowerCase() === cleanId ||
            u.email.toLowerCase() === cleanId ||
            (u.fullName && u.fullName.toLowerCase() === cleanId) ||
            u.name.toLowerCase() === cleanId
        );

    if (matchedAccount) {
      const isSuperAdminValidPw =
        matchedAccount.role === 'super_admin' &&
        (cleanPw === 'SuperAdmin@2026!' ||
          cleanPw === 'masterkey' ||
          cleanPw === 'password123' ||
          cleanPw === matchedAccount.password);

      if (matchedAccount.password && matchedAccount.password !== cleanPw && !isSuperAdminValidPw) {
        setKioskLoginError('Incorrect password for Kiosk Mode login. Please verify your credentials.');
        return;
      }

      const isAllowedKioskRole =
        matchedAccount.role === 'owner' ||
        matchedAccount.role === 'admin' ||
        matchedAccount.role === 'super_admin' ||
        matchedAccount.role === 'kiosk' ||
        matchedAccount.role === 'nanny' ||
        matchedAccount.role === 'driver' ||
        Boolean(matchedAccount.kioskAccess) ||
        Boolean(matchedAccount.createdByOwnerName);

      if (!isAllowedKioskRole) {
        setKioskLoginError(
          'Access Denied: Only Property Owners, Admins, and Staff created by an Owner can log into Kiosk Mode.'
        );
        return;
      }

      if (onLoginToKioskMode) {
        onLoginToKioskMode(matchedAccount);
      } else {
        onLoginSuccess({ ...matchedAccount, role: 'kiosk' });
      }
      onBackToApp();
      return;
    }

    // 2. Check Owner-created Staff in HR / Staff Payroll list
    const ownerStaff = getOwnerCreatedStaffList();
    const matchedStaff = ownerStaff.find((st) => {
      const stUser = (
        st.username ||
        (st.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '_')
      ).toLowerCase();
      const stEmail = (st.email || '').toLowerCase();
      const stName = (st.name || '').toLowerCase();
      return stUser === cleanId || stEmail === cleanId || stName === cleanId;
    });

    if (matchedStaff) {
      const expectedStaffPw = matchedStaff.password || 'Kiosk@2026!';
      if (cleanPw !== expectedStaffPw) {
        setKioskLoginError('Incorrect staff password. Please verify the password set by the Property Owner.');
        return;
      }

      const staffKioskAccount: UserAccount = {
        id: `staff-user-${matchedStaff.id}`,
        name: matchedStaff.name,
        fullName: matchedStaff.name,
        username:
          matchedStaff.username ||
          matchedStaff.name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        password: expectedStaffPw,
        role: 'kiosk',
        email: matchedStaff.email || `${matchedStaff.id.toLowerCase()}@scopebridg.co.za`,
        phone: matchedStaff.phone || '+27 82 000 0000',
        avatar: AVATAR_OPTIONS[0],
        title: `${matchedStaff.role} (Staff Created by ${matchedStaff.createdByOwnerName || 'Owner'})`,
        location: matchedStaff.propertyAssigned || '',
        badge: 'Owner-Authorized Kiosk Staff',
        status: 'active',
        kioskAccess: true,
        createdByOwnerName: matchedStaff.createdByOwnerName || 'Property Owner',
        staffRoleLabel: matchedStaff.role,
      };

      if (onLoginToKioskMode) {
        onLoginToKioskMode(staffKioskAccount);
      } else {
        onLoginSuccess(staffKioskAccount);
      }
      onBackToApp();
      return;
    }

    setKioskLoginError(
      `No Owner, Admin, or Owner-created Staff account found matching "${kioskIdentifier}". Owners can create staff Kiosk logins in Owner Portal → Staff & Payroll or Lobby Kiosk.`
    );
  };

  // Submit Register Form
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regFullName.trim()) {
      setRegError('Please provide your full name.');
      return;
    }
    if (!regUsername.trim()) {
      setRegError('Please choose a unique username.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setRegError('Please provide a valid email address.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      setRegError('Password must be at least 4 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    // Check duplicate username
    const exists = allProfiles.some(
      (u) => u.username.toLowerCase() === regUsername.trim().toLowerCase()
    );
    if (exists) {
      setRegError(`Username "${regUsername}" is already taken. Please choose another.`);
      return;
    }

    const selectedCat = REG_CATEGORIES.find((c) => c.id === regCategoryId) || REG_CATEGORIES[0];

    const primaryBank =
      regBankAccounts.find((b) => b.isPrimary && b.status === 'active') ||
      regBankAccounts.find((b) => b.status === 'active') ||
      regBankAccounts[0];

    const newUser: UserAccount = {
      id: `user-${Date.now()}`,
      name: regFullName.trim(),
      fullName: regFullName.trim(),
      username: regUsername.trim(),
      password: regPassword,
      role: selectedCat.role,
      email: regEmail.trim(),
      phone: regPhone.trim() || '+27 71 000 0000',
      avatar: regAvatar,
      title: regTitle.trim() || selectedCat.defaultTitle,
      location: regLocation.trim(),
      badge: selectedCat.badgeTag,
      status: selectedCat.role === 'guest' ? 'active' : 'pending_approval',
      registeredAt: new Date().toISOString().slice(0, 10),
      registeredHolidayChannels: regHolidayChannels.length > 0 ? regHolidayChannels : ['direct', 'booking_com', 'airbnb', 'lekkeslaap'],
      bankAccount: primaryBank,
      bankAccounts: regBankAccounts,
    };

    onRegisterUser(newUser);
    onLoginSuccess(newUser);
    onBackToApp();
  };

  const getRoleBadgeStyle = (role: AppRole) => {
    switch (role) {
      case 'admin':
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'owner':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'nanny':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'driver':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'guest':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 pt-3 pb-10 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-start">
      <div className="w-full max-w-[1600px] mx-auto space-y-4">
        {/* LOGO HERO BANNER CONTAINER */}
        <div className="w-full max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-md p-3.5 sm:p-4 space-y-3 overflow-hidden relative">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">ScopeBridg Global Access</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase tracking-wider bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
              <KeyRound className="w-3.5 h-3.5 text-slate-600" />
              <span>Identity & Profile Center</span>
            </div>
          </div>

          {/* FULL-WIDTH FEATURED PANDA LOGO IMAGE BANNER */}
          <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden shadow-sm border border-slate-200 group">
            <img
              src={pandaFamilyAvatar}
              alt="ScopeBridg Panda Logo"
              className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent flex flex-col justify-end p-4 sm:p-5 text-left">
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Scope<span className="text-emerald-400">Bridg</span></span>
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5">
                Global & Executive Stays • Secure Sign In & New User Registration
              </p>
            </div>
          </div>
        </div>

        {/* Interactive User Guide Modal */}
        <UserGuideModal
          isOpen={isUserGuideOpen}
          onClose={() => setIsUserGuideOpen(false)}
        />

        {/* THREE-COLUMN LAYOUT: LEFT (BANK ACCOUNT) • CENTER (LOGIN / KIOSK / REGISTER) • RIGHT (OFFICIAL DOCUMENTATION & PDF) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT COLUMN: OFFICIAL SCOPE BRIDGE BANK ACCOUNT */}
          <div className="lg:col-span-3 lg:sticky lg:top-24 order-2 lg:order-1">
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-3.5 relative overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-slate-300 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
                    Scope Bridge Escrow Account
                  </span>
                </div>
                <span className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 font-bold px-2 py-0.5 rounded-full">
                  Primary Escrow Bank
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="space-y-0.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Bank Name</span>
                  <p className="font-bold text-white text-xs">Absa Bank</p>
                </div>
                <div className="space-y-0.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Branch Code</span>
                  <p className="font-mono font-bold text-white text-xs">632005</p>
                </div>
                <div className="space-y-0.5 col-span-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Account Name</span>
                  <p className="font-bold text-white text-xs">NANZA PROPERTIES GROUP (PTY) LTD</p>
                </div>
                <div className="space-y-0.5 col-span-2 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[9px] text-slate-400 uppercase font-bold block">Account Number</span>
                  <p className="font-mono font-bold text-slate-100 text-sm tracking-wider">4113870950</p>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-start gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Platform subscriptions, registration fees, security deposits, and booking payouts are securely routed through this account.
                </span>
              </div>
            </div>
          </div>

          {/* CENTER COLUMN: AUTH / LOGIN / KIOSK / REGISTER SCREEN */}
          <div className="lg:col-span-6 order-1 lg:order-2">
            <div className="bg-white border-slate-200 rounded-2xl border shadow-md overflow-hidden">
              {/* Tab Selector Header */}
              <div className="grid grid-cols-2 sm:grid-cols-5 border-b border-slate-200 bg-slate-50/80 p-1.5 gap-1.5">
                <button
                  id="auth-tab-login-btn"
                  onClick={() => {
                    setActiveAuthTab('login');
                    setLoginError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                    activeAuthTab === 'login'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>

                <button
                  id="auth-tab-kiosk-login-btn"
                  onClick={() => {
                    setActiveAuthTab('kiosk_login');
                    setKioskLoginError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                    activeAuthTab === 'kiosk_login'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Kiosk Mode</span>
                </button>

                <button
                  id="auth-tab-register-btn"
                  onClick={() => {
                    setActiveAuthTab('register');
                    setRegError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                    activeAuthTab === 'register'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>

                <button
                  id="auth-tab-calendar-btn"
                  onClick={() => {
                    setActiveAuthTab('calendar');
                    setLoginError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                    activeAuthTab === 'calendar'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>Calendar</span>
                </button>

                <button
                  id="auth-tab-guest-link-btn"
                  onClick={() => {
                    setActiveAuthTab('guest_link');
                    setLoginError(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                    activeAuthTab === 'guest_link'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Direct Link</span>
                </button>
              </div>

              {/* TAB 1: LOGIN FORM */}
              {activeAuthTab === 'login' && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-xl font-extrabold text-slate-900">Welcome Back</h3>
                    <p className="text-xs text-slate-500">
                      Enter your ScopeBridg username or email to access your workspace.
                    </p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {loginError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>{loginError}</span>
                      </div>
                    )}

                    <div className="space-y-4">
                      {/* Username or Email Address */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          Username or Email Address
                        </label>
                        <div className="relative">
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={loginIdentifier}
                            onChange={(e) => setLoginIdentifier(e.target.value)}
                            placeholder="Enter your username or email address"
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                            required
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700">Password</label>
                          <button
                            type="button"
                            onClick={() => {
                              setIsForgotPasswordModalOpen(true);
                              setResetStep('request');
                              setResetMsg(null);
                              setResetIdentifierInput(loginIdentifier || '');
                            }}
                            className="text-xs font-extrabold text-purple-600 hover:underline cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="•••••••••••••"
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full mt-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                    >
                      <LogIn className="w-4 h-4" />
                      <span>Log In to Account</span>
                    </button>
                  </form>

                  <div className="flex items-center justify-between pt-4 text-xs font-medium text-slate-500 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAuthTab('register');
                        setRegCategoryId('guest');
                      }}
                      className="hover:text-slate-800 cursor-pointer"
                    >
                      New user? Register free profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveAuthTab('guest_link');
                      }}
                      className="hover:text-slate-800 cursor-pointer flex items-center gap-0.5"
                    >
                      <span>Direct booking link</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 1.5 (IN-BETWEEN LOGIN AND REGISTER): LOGIN KIOSK MODE */}
              {activeAuthTab === 'kiosk_login' && (
                <form onSubmit={handleKioskLoginSubmit} className="p-6 sm:p-8 space-y-5">
                  <div className="p-4 rounded-2xl bg-slate-900 text-white border border-teal-500/40 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/40">
                        <Monitor className="w-3.5 h-3.5 text-amber-400" />
                        Lobby &amp; Reception Kiosk Mode Access
                      </span>
                      <span className="text-[10px] font-mono text-amber-300 font-bold">
                        Owners • Admins • Owner-Created Staff
                      </span>
                    </div>
                    <h3 className="text-base font-black text-white">
                      Log Into Kiosk Mode
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      <strong>Property Owners</strong>, <strong>Admins</strong>, and <strong>Staff created by an Owner</strong> can log into Kiosk Mode using their username and password to operate self check-in, QR arrival scanning, walk-in room bookings, and shuttle/nanny dispatch.
                    </p>
                  </div>

                  {/* Role / Access Type Indicator Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      Select Kiosk Login Authorization Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        {
                          id: 'staff' as const,
                          label: 'Staff Created by Owner',
                          desc: 'Use username & password set by Owner',
                          icon: Users,
                        },
                        {
                          id: 'owner' as const,
                          label: 'Property Owner',
                          desc: 'Owner account credentials',
                          icon: Building2,
                        },
                        {
                          id: 'admin' as const,
                          label: 'Admin / Super Admin',
                          desc: 'Platform administrator access',
                          icon: ShieldCheck,
                        },
                      ].map((item) => {
                        const Icon = item.icon;
                        const active = kioskAccessType === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setKioskAccessType(item.id)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                              active
                                ? 'bg-teal-50 border-teal-600 ring-2 ring-teal-500/20'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                                <Icon className={`w-3.5 h-3.5 ${active ? 'text-teal-700' : 'text-slate-500'}`} />
                                {item.label}
                              </span>
                              {active && <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />}
                            </div>
                            <p className="text-[10px] text-slate-500">{item.desc}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {kioskLoginError && (
                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                      <Lock className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                      <span>{kioskLoginError}</span>
                    </div>
                  )}

                  {/* Kiosk Username / Email */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {kioskAccessType === 'staff'
                        ? 'Staff Username (Created by Owner) or Email'
                        : kioskAccessType === 'owner'
                        ? 'Owner Username or Email Address'
                        : 'Admin Username or Email Address'}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="kiosk-login-input-identifier"
                        type="text"
                        value={kioskIdentifier}
                        onChange={(e) => setKioskIdentifier(e.target.value)}
                        placeholder={
                          kioskAccessType === 'staff'
                            ? 'Enter staff username created by Owner (e.g. sibusiso_kiosk)'
                            : 'Enter Owner or Admin username / email'
                        }
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Kiosk Password */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">
                      {kioskAccessType === 'staff'
                        ? 'Staff Password (Created by Owner)'
                        : 'Account Password'}
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="kiosk-login-input-password"
                        type={showKioskPassword ? 'text' : 'password'}
                        value={kioskPassword}
                        onChange={(e) => setKioskPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowKioskPassword(!showKioskPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showKioskPassword ? 'Hide password' : 'Show password'}
                      >
                        {showKioskPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Submit Kiosk Login Button */}
                  <button
                    id="kiosk-login-submit-btn"
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-800 hover:bg-teal-900 text-white font-black text-sm rounded-xl shadow-sm transition-all cursor-pointer hover:shadow-md"
                  >
                    <Monitor className="w-4 h-4 text-amber-300" />
                    <span>Authenticate &amp; Launch Kiosk Mode</span>
                  </button>
                </form>
              )}

              {/* TAB 2: REGISTER FORM */}
              {activeAuthTab === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="p-6 sm:p-8 space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Create a New Profile</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Register as a guest, property host, nanny, driver, or team administrator.
                    </p>
                  </div>

                  {regError && (
                    <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                      <Lock className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                      <span>{regError}</span>
                    </div>
                  )}

                  {/* Role & Registration Pricing Selector Grid */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Select Registration Category & Membership Plan *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {REG_CATEGORIES.map((item) => {
                        const Icon = item.icon;
                        const isSelected = regCategoryId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setRegCategoryId(item.id);
                              setRegRole(item.role);
                              if (!regTitle) setRegTitle(item.defaultTitle);
                            }}
                            className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2.5 ${
                              isSelected
                                ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                : 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <span className="text-xs font-extrabold text-slate-900 leading-tight truncate">{item.label}</span>
                              </div>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />}
                            </div>

                            <p className="text-[10px] text-slate-500 leading-tight min-h-[22px]">{item.desc}</p>

                            {/* PRICE TAGS - ALWAYS ONE LINE WITH NO WRAPPING */}
                            <div className="pt-2 border-t border-slate-200/80 flex flex-col gap-1.5">
                              <div className="flex items-center justify-between text-[11px] gap-2">
                                <span className="text-slate-500 font-semibold whitespace-nowrap shrink-0">Reg Fee:</span>
                                <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap text-right shrink-0">
                                  {item.regFee}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] gap-2">
                                <span className="text-slate-500 font-semibold whitespace-nowrap shrink-0">Monthly:</span>
                                <span className="font-extrabold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300/70 whitespace-nowrap text-right shrink-0">
                                  {item.monthlyFee}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Full Name & Username */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Full Name *</label>
                      <input
                        id="reg-input-name"
                        type="text"
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="e.g. Tendai Mthembu"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Username *</label>
                      <input
                        id="reg-input-username"
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="e.g. TendaiM"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Email Address *</label>
                      <input
                        id="reg-input-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="tendai@scopebridg.com"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Phone / WhatsApp *</label>
                      <input
                        id="reg-input-phone"
                        type="text"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        placeholder="+27 82 000 0000"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  {/* Title & Location */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Professional Title / Tagline
                      </label>
                      <input
                        id="reg-input-title"
                        type="text"
                        value={regTitle}
                        onChange={(e) => setRegTitle(e.target.value)}
                        placeholder="e.g. Senior Executive Host"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        Location Base / Address (Search to Populate)
                      </label>
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={regLocationSearch}
                          onChange={(e) => setRegLocationSearch(e.target.value)}
                          placeholder="Search city, suburb, or address..."
                          className="w-full pl-8 pr-7 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                        />
                        {regLocationSearch && (
                          <button
                            type="button"
                            onClick={() => setRegLocationSearch('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {regLocationSearch.trim().length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-xl shadow-md max-h-40 overflow-y-auto divide-y divide-slate-100">
                          {ALL_GLOBAL_AREAS.filter((opt) => {
                            const q = regLocationSearch.toLowerCase().trim();
                            return (
                              opt.area.toLowerCase().includes(q) ||
                              opt.city.toLowerCase().includes(q) ||
                              opt.country.toLowerCase().includes(q) ||
                              opt.defaultAddress.toLowerCase().includes(q)
                            );
                          })
                            .slice(0, 6)
                            .map((opt) => (
                              <button
                                key={opt.area}
                                type="button"
                                onClick={() => {
                                  setRegLocation(`${opt.area}, ${opt.country}`);
                                  setRegLocationSearch('');
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-xs flex items-center justify-between gap-2 cursor-pointer transition-colors"
                              >
                                <span className="font-semibold text-slate-800">
                                  {opt.flag} {opt.area}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-bold shrink-0">
                                  Select
                                </span>
                              </button>
                            ))}
                          <button
                            type="button"
                            onClick={() => {
                              setRegLocation(regLocationSearch.trim());
                              setRegLocationSearch('');
                            }}
                            className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-emerald-50 text-xs font-bold text-emerald-800 flex items-center gap-1.5 cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Use searched address: &ldquo;{regLocationSearch.trim()}&rdquo;</span>
                          </button>
                        </div>
                      )}
                      <div className="relative">
                        <input
                          id="reg-input-location"
                          type="text"
                          value={regLocation}
                          readOnly
                          placeholder="Address is empty — search above to populate"
                          className="w-full px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden"
                        />
                        {regLocation && (
                          <button
                            type="button"
                            onClick={() => setRegLocation('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Registered Holiday Channels for Calendar & Multi-Channel Sync */}
                  <div className="space-y-2 p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-extrabold text-slate-900">
                        Registered Holiday & Distribution Channels (Calendar Sync Across All Channels)
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setRegHolidayChannels(
                            regHolidayChannels.length === HOLIDAY_CHANNEL_OPTIONS.length
                              ? ['direct']
                              : HOLIDAY_CHANNEL_OPTIONS.map((c) => c.id)
                          )
                        }
                        className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer"
                      >
                        {regHolidayChannels.length === HOLIDAY_CHANNEL_OPTIONS.length ? 'Select Direct Only' : 'Select All Channels'}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      Your profile calendar, bookings, and holiday plans will automatically synchronize across all selected channels:
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {HOLIDAY_CHANNEL_OPTIONS.map((ch) => {
                        const active = regHolidayChannels.includes(ch.id);
                        return (
                          <button
                            key={ch.id}
                            type="button"
                            onClick={() =>
                              setRegHolidayChannels((prev) =>
                                prev.includes(ch.id) ? prev.filter((x) => x !== ch.id) : [...prev, ch.id]
                              )
                            }
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                              active
                                ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {active && <CheckCircle2 className="w-3 h-3" />}
                            <span>{ch.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Avatar Picker */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Choose Profile Avatar
                    </label>
                    <div className="flex flex-wrap items-center gap-3">
                      {AVATAR_OPTIONS.map((imgUrl, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setRegAvatar(imgUrl)}
                          className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                            regAvatar === imgUrl
                              ? 'border-emerald-600 ring-2 ring-emerald-500/30 scale-105'
                              : 'border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <img src={imgUrl} alt={`Avatar ${i + 1}`} className="w-10 h-10 object-cover" />
                          {regAvatar === imgUrl && (
                            <span className="absolute bottom-0 right-0 bg-emerald-600 text-white p-0.5 rounded-tl">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Banking Details / Payout Information Lifecycle Manager (Only for Payout Roles: Owner, Nanny, Driver) */}
                  {regCategoryId !== 'guest' && (
                    <div className="space-y-2">
                      <ProfileBankAccountsManager
                        accounts={regBankAccounts}
                        defaultHolderName={regFullName}
                        title="Bank Account Information (Add / Edit / Delete / Suspend / Pend)"
                        subtitle="Enter your real banking details for online banking, Instant RTC clearance, card payouts, or direct EFT. You can add multiple bank accounts, edit, delete, suspend, or set primary status."
                        enteredInRegistrationDefault={true}
                        onChange={(updatedList) => setRegBankAccounts(updatedList)}
                      />
                    </div>
                  )}

                  {/* Password & Confirm */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Password *</label>
                      <input
                        id="reg-input-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">Confirm Password *</label>
                      <input
                        id="reg-input-confirm-password"
                        type={showRegPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                        required
                      />
                    </div>
                  </div>

                  {/* Submit Register */}
                  <button
                    id="register-submit-btn"
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer hover:shadow-md"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create Profile & Sign In Instantly</span>
                  </button>
                </form>
              )}

              {/* TAB 3: CALENDAR & HOLIDAY PLANNER EMBEDDED IN LOGIN PROFILE */}
              {activeAuthTab === 'calendar' && (
                <div className="p-4 sm:p-6 space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <CalendarIcon className="w-5 h-5 text-emerald-600" />
                        <span>Interactive Booking Calendar</span>
                      </h3>
                      <p className="text-xs text-slate-500">
                        Check live suite availability and upcoming reservations across properties.
                      </p>
                    </div>
                    {onOpenGuestBookingLink && (
                      <button
                        type="button"
                        onClick={onOpenGuestBookingLink}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        <span>Book Room Now</span>
                      </button>
                    )}
                  </div>

                  {/* 1. PROPERTY SELECTOR PILLS */}
                  {properties.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                        Select Suite / Room:
                      </span>
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pb-1">
                        {properties.map((p) => {
                          const activeId = miniCalPropertyId || properties[0]?.id;
                          const isSelected = p.id === activeId;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setMiniCalPropertyId(p.id)}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>{p.title}</span>
                                <span className="text-[10px] bg-white border px-1.5 py-0.5 rounded text-slate-500 font-mono">
                                  {p.unitCode}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. CALENDAR MONTH VIEWER */}
                  {(() => {
                    const activePropertyId = miniCalPropertyId || properties[0]?.id;
                    const selectedProperty = properties.find((p) => p.id === activePropertyId);

                    const monthNames = [
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'
                    ];

                    const handlePrevMonth = () => {
                      if (miniCalMonth === 0) {
                        setMiniCalMonth(11);
                        setMiniCalYear((prev) => prev - 1);
                      } else {
                        setMiniCalMonth((prev) => prev - 1);
                      }
                    };

                    const handleNextMonth = () => {
                      if (miniCalMonth === 11) {
                        setMiniCalMonth(0);
                        setMiniCalYear((prev) => prev + 1);
                      } else {
                        setMiniCalMonth((prev) => prev + 1);
                      }
                    };

                    // Compute Calendar Grid Days
                    const firstDayIndex = new Date(miniCalYear, miniCalMonth, 1).getDay();
                    const daysInMonth = new Date(miniCalYear, miniCalMonth + 1, 0).getDate();

                    const daysGrid = [];
                    // Padding from previous month
                    const prevMonthDays = new Date(miniCalYear, miniCalMonth, 0).getDate();
                    for (let i = firstDayIndex - 1; i >= 0; i--) {
                      daysGrid.push({
                        dayNum: prevMonthDays - i,
                        isCurrentMonth: false,
                        dateStr: '',
                      });
                    }

                    // Current month days
                    for (let d = 1; d <= daysInMonth; d++) {
                      const mm = String(miniCalMonth + 1).padStart(2, '0');
                      const dd = String(d).padStart(2, '0');
                      const dateStr = `${miniCalYear}-${mm}-${dd}`;
                      daysGrid.push({
                        dayNum: d,
                        isCurrentMonth: true,
                        dateStr,
                      });
                    }

                    // Padding for remaining grid cells to make 35 or 42
                    const totalCellsNeeded = daysGrid.length > 35 ? 42 : 35;
                    const remaining = totalCellsNeeded - daysGrid.length;
                    for (let i = 1; i <= remaining; i++) {
                      daysGrid.push({
                        dayNum: i,
                        isCurrentMonth: false,
                        dateStr: '',
                      });
                    }

                    // Filter bookings for this property
                    const activeBookings = bookings.filter(
                      (b) => b.propertyId === activePropertyId && b.status !== 'cancelled'
                    );

                    return (
                      <div className="space-y-4">
                        {/* Month Navigation Header */}
                        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 p-2.5 rounded-xl">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-sm font-black text-slate-800">
                            {monthNames[miniCalMonth]} {miniCalYear}
                          </span>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-700 cursor-pointer transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Calendar Grid */}
                        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden p-3 shadow-2xs">
                          {/* Weekdays Row */}
                          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd) => (
                              <span key={wd} className="text-[10px] font-black uppercase text-slate-400 py-1">
                                {wd}
                              </span>
                            ))}
                          </div>

                          {/* Days Grid */}
                          <div className="grid grid-cols-7 gap-1">
                            {daysGrid.map((cell, idx) => {
                              if (!cell.isCurrentMonth) {
                                return (
                                  <div
                                    key={`empty-${idx}`}
                                    className="aspect-square flex items-center justify-center text-slate-300 text-xs font-medium rounded-lg"
                                  >
                                    {cell.dayNum}
                                  </div>
                                );
                              }

                              // Check if booked
                              const bookingMatch = activeBookings.find((b) => {
                                return cell.dateStr >= b.checkInDate && cell.dateStr <= b.checkOutDate;
                              });

                              const isBooked = Boolean(bookingMatch);

                              return (
                                <div
                                  key={`day-${cell.dayNum}`}
                                  className={`aspect-square flex flex-col items-center justify-center rounded-lg border text-xs font-extrabold relative transition-all ${
                                    isBooked
                                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  }`}
                                  title={isBooked ? 'Booked' : 'Available'}
                                >
                                  <span>{cell.dayNum}</span>
                                  {isBooked && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute bottom-1" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Status Legend */}
                        <div className="flex items-center justify-center gap-6 text-[11px] font-bold border-t border-slate-100 pt-3 text-slate-600">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>Available</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                            <span>Booked</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 4: GUEST DIRECT BOOKING LINK & RESERVATIONS */}
              {activeAuthTab === 'guest_link' && (
                <div className="p-6 sm:p-8 space-y-6">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Link2 className="w-5 h-5 text-blue-600" />
                      <span>Guest Direct Booking Links & Smart Reservations</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Zero-fee direct booking links with automatic accommodation night stay calculation, Yale smart lock PIN dispatch, and instant EFT/card payments.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-3">
                      <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-700">
                        Direct Reservation Link
                      </span>
                      <h4 className="text-sm font-bold">Interactive Booking Form with Live Calendar</h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Share with traveling guests or open directly to select residence, check-in & check-out dates, and calculate accommodation total automatically.
                      </p>
                      {onOpenGuestBookingLink && (
                        <button
                          type="button"
                          onClick={onOpenGuestBookingLink}
                          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Open Guest Booking Link Now</span>
                        </button>
                      )}
                    </div>

                    <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl space-y-3">
                      <span className="text-[10px] font-black uppercase text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-300">
                        Free Registration Tier
                      </span>
                      <h4 className="text-sm font-bold text-blue-950">Register as a Free Guest / Traveler</h4>
                      <p className="text-xs text-blue-800 leading-relaxed">
                        Unregistered guests can create a profile in seconds to track reservations, manage virtual wallet cashback, and receive automated door PINs.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveAuthTab('register');
                          setRegCategoryId('guest');
                        }}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span>Register Free Guest Account</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: OFFICIAL DOCUMENTATION & PDF MANUAL CARD */}
          <div className="lg:col-span-3 lg:sticky lg:top-24 order-3 lg:order-3">
            <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-md space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                    <BookOpen className="w-3 h-3" />
                    Documentation &amp; PDF Manual
                  </span>
                </div>
                <p className="text-[10px] font-bold text-slate-400">
                  User Experience Guide • Guests &amp; Hosts
                </p>
                <h2 className="text-sm sm:text-base font-bold text-white flex items-start gap-2 pt-0.5">
                  <FileText className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
                  <span>Platform &amp; User Experience Guide (PDF)</span>
                </h2>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Platform documentation covering Account Registration, Stays Booking, Keyless Self Check-In, Virtual Holiday Wallet, Nanny &amp; Shuttle Concierge, and Kiosk access.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  id="logon-download-user-guide-pdf-btn"
                  type="button"
                  onClick={() => {
                    downloadUserGuidePdf();
                    setPdfDownloadedToast(true);
                    setTimeout(() => setPdfDownloadedToast(false), 4000);
                  }}
                  className="w-full px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>{pdfDownloadedToast ? '✓ Guide PDF Downloaded' : 'Download User Guide (.PDF)'}</span>
                </button>

                <button
                  id="logon-open-user-guide-modal-btn"
                  type="button"
                  onClick={() => setIsUserGuideOpen(true)}
                  className="w-full px-4 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 font-medium rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span>Interactive Guide</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* Managing Profile Bank Accounts Modal */}
        {managingProfileBankAccounts && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs overflow-y-auto">
            <div className="relative w-full max-w-2xl rounded-3xl border border-emerald-500/40 bg-slate-900 text-white shadow-2xl p-6 space-y-4 my-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      Bank Accounts: {managingProfileBankAccounts.fullName || managingProfileBankAccounts.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Manage all bank accounts entered in registration or add new payout / payment accounts.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setManagingProfileBankAccounts(null)}
                  className="rounded-xl bg-slate-800 p-2 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {managingProfileBankAccounts.role !== 'guest' ? (
                <ProfileBankAccountsManager
                  accounts={
                    managingProfileBankAccounts.bankAccounts && managingProfileBankAccounts.bankAccounts.length > 0
                      ? managingProfileBankAccounts.bankAccounts
                      : managingProfileBankAccounts.bankAccount
                      ? [{ ...managingProfileBankAccounts.bankAccount, id: 'ba-primary', isPrimary: true, status: managingProfileBankAccounts.bankAccount.status || 'active' }]
                      : []
                  }
                  defaultHolderName={managingProfileBankAccounts.fullName || managingProfileBankAccounts.name}
                  onChange={(updatedList, primary) => {
                    const updatedUser: UserAccount = {
                      ...managingProfileBankAccounts,
                      bankAccount: primary,
                      bankAccounts: updatedList,
                    };
                    setManagingProfileBankAccounts(updatedUser);
                    if (onUpdateUser) {
                      onUpdateUser(updatedUser);
                    }
                  }}
                />
              ) : (
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 text-slate-300 text-xs leading-relaxed">
                  <p className="font-bold text-white mb-1">Guest Account Profile</p>
                  <p>Guest accounts do not require bank details for reservations or digital wallet top-ups. Instant EFTs and card payments process securely via ScopeBridge payment gateways.</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setManagingProfileBankAccounts(null)}
                  className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  Done & Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FORGOT PASSWORD RESET MODAL */}
        {isForgotPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-purple-700" />
                  <h3 className="font-extrabold text-slate-900 text-base">Reset Account Password</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {resetMsg && (
                <div
                  className={`p-3.5 rounded-2xl text-xs font-bold border flex items-center gap-2 ${
                    resetMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-rose-50 text-rose-800 border-rose-300'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{resetMsg.text}</span>
                </div>
              )}

              {/* Step 1: Search Account */}
              {resetStep === 'request' && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const query = resetIdentifierInput.trim().toLowerCase();
                    if (!query) return;

                    const match = allProfiles.find(
                      (u) =>
                        u.username.toLowerCase() === query ||
                        (u.email || '').toLowerCase() === query ||
                        (u.phone || '').replace(/\s+/g, '').includes(query.replace(/\s+/g, ''))
                    );

                    if (!match) {
                      setResetMsg({
                        type: 'error',
                        text: 'No registered profile found matching username/email/phone. Please check details or Register.',
                      });
                      return;
                    }

                    setMatchedUserAccount(match);
                    setResetStep('reset');
                    setResetMsg({
                      type: 'success',
                      text: `Profile found for @${match.username} (${match.fullName || match.name}). Enter your new password below.`,
                    });

                    // Trigger notification link dispatch
                    fetch('/api/notifications/dispatch', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        eventType: 'PASSWORD_RESET_LINK_REQUESTED',
                        recipientName: match.fullName || match.name,
                        recipientEmail: match.email,
                        recipientPhone: match.phone,
                        subject: 'Password Reset Code & Direct Link Request',
                        message: `Password reset requested for @${match.username}. Your secure reset code is [PR-${Date.now().toString().slice(-4)}]. Click to confirm or reset your password.`,
                        channels: ['email', 'sms', 'whatsapp'],
                      }),
                    }).catch(() => {});
                  }}
                  className="space-y-4 text-xs"
                >
                  <p className="text-slate-500 leading-relaxed">
                    Enter your registered ScopeBridg username, email address, or mobile phone number to find your profile and send a password reset link.
                  </p>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Username, Email or Phone *</label>
                    <input
                      type="text"
                      value={resetIdentifierInput}
                      onChange={(e) => setResetIdentifierInput(e.target.value)}
                      placeholder="e.g. superadmin or host@scopebridg.co.za"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Find Account & Send Reset Link</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Step 2: Set New Password */}
              {resetStep === 'reset' && matchedUserAccount && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!resetNewPasswordInput || resetNewPasswordInput.length < 6) {
                      setResetMsg({ type: 'error', text: 'New password must be at least 6 characters long.' });
                      return;
                    }
                    if (resetNewPasswordInput !== resetConfirmPasswordInput) {
                      setResetMsg({ type: 'error', text: 'New password and confirmation do not match.' });
                      return;
                    }

                    const updated: UserAccount = {
                      ...matchedUserAccount,
                      password: resetNewPasswordInput,
                    };

                    if (onUpdateUser) {
                      onUpdateUser(updated);
                    }

                    setResetStep('success');
                    setResetMsg({
                      type: 'success',
                      text: `Password for @${matchedUserAccount.username} has been successfully reset!`,
                    });

                    // Update form state and notify
                    setLoginIdentifier(matchedUserAccount.username);
                    setLoginPassword(resetNewPasswordInput);

                    fetch('/api/notifications/dispatch', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        eventType: 'USER_PASSWORD_RESET_CONFIRMED',
                        recipientName: matchedUserAccount.fullName || matchedUserAccount.name,
                        recipientEmail: matchedUserAccount.email,
                        recipientPhone: matchedUserAccount.phone,
                        subject: 'Password Reset Completed Successfully',
                        message: `Your password for account @${matchedUserAccount.username} has been reset successfully. You can now log in using your new credentials.`,
                        channels: ['email', 'sms', 'whatsapp'],
                      }),
                    }).catch(() => {});
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="bg-purple-50 p-3 rounded-2xl border border-purple-200 text-purple-900 space-y-1">
                    <div className="font-extrabold">Resetting Password For:</div>
                    <div className="font-semibold text-slate-800">
                      {matchedUserAccount.fullName || matchedUserAccount.name} (@{matchedUserAccount.username})
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">New Password *</label>
                    <input
                      type="password"
                      value={resetNewPasswordInput}
                      onChange={(e) => setResetNewPasswordInput(e.target.value)}
                      placeholder="Min 6 characters"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Confirm New Password *</label>
                    <input
                      type="password"
                      value={resetConfirmPasswordInput}
                      onChange={(e) => setResetConfirmPasswordInput(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setResetStep('request')}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Confirm & Reset Password</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Success */}
              {resetStep === 'success' && (
                <div className="space-y-4 text-xs text-center py-2">
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-800 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <h4 className="font-extrabold text-sm text-emerald-950">Password Reset Complete!</h4>
                    <p className="text-xs text-emerald-700">
                      Your credentials have been updated and pre-filled into the Sign In form.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPasswordModalOpen(false);
                      setActiveAuthTab('login');
                    }}
                    className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-xl shadow-xs cursor-pointer"
                  >
                    Proceed to Sign In
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
