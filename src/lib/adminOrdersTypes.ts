export type AdminOrderRow = {
  id: string;
  order_id: string;
  created_at: string;
  created_at_pkt: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone_number: string | null;
  city: string | null;
  country: string | null;
  value: number;
  currency: string;
  event_name: string;
  image_upload: string | null;
};