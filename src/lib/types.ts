


export type TerminalStatus = 'verified' | 'pending' | 'not_verified' | 'shipped' | 'awaits_verification_after_shipping' | 'rented' | 'expired';
export type BoxType = 'type_A' | 'type_B';
export type Tier = 'Верхний' | 'Нижний' | 'Аренда';

export type HistoryEvent = {
  date: string;
  event: string;
  responsible: string;
  statusBeforeShipment?: TerminalStatus;
};

export type Terminal = {
  serialNumber: string;
  status: TerminalStatus;
  boxType: BoxType;
  position?: number; // Cell number within the section
  verifiedUntil?: string | null;
  model: string;
  location?: {
    sectionId: string;
    cell: number;
  };
  lastVerificationDate?: string | null;
  history: HistoryEvent[];
  returnedFrom?: string; // Add this field to track returns
};

export type ShelfSection = {
  id: string;
  tier: Tier;
  capacity: {
    [key in BoxType]: { rows: number; cols: number };
  };
  currentBoxType: BoxType | null;
  terminals: Terminal[];
};

export type Shipment = {
  terminalId: string;
  shippingDate: string;
  contragent: string;
  statusBeforeShipment: TerminalStatus;
};

export type ShipmentWithDetails = Shipment & {
    serialNumber: string;
    initialStatus: TerminalStatus | undefined;
    model: string;
    boxType: BoxType;
    history: HistoryEvent[];
    lastVerificationDate?: string | null;
    verifiedUntil?: string | null;
}

export type UserRole = 'Administrator' | 'Verifier' | 'User';

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
  passwordHash?: string;
};

export type NotificationSettings = {
  shippingUnverified: boolean;
  shippingExpired: boolean;

  verificationNeeded: boolean;
  verificationPending: boolean;
};

export interface VerificationResult {
    lastVerificationDate: string | null;
    verifiedUntil: string | null;
    isValidType: boolean;
}

export interface ArshinVerificationParams {
    serialNumber: string;
}

export type VerificationRequestStatus = 'pending' | 'processed';

export type VerificationRequest = {
  id: string;
  status: VerificationRequestStatus;
  createdAt: string;
  processedAt?: string;
terminalIds: string[];
  createdBy: string;
};

export interface VerificationRequestContextType {
  verificationRequests: VerificationRequest[];
  createVerificationRequest: (terminalIds: string[], customId?: string) => void;
  processVerificationRequest: (requestId: string) => void;
  updateVerificationRequestDetails: (requestId: string, newId: string, newDate: string) => void;
}
