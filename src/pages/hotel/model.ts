import { sample } from 'effector';
import { createGate } from 'effector-react';
import { detailsRequested, detailsReset } from '@/entities/hotel';
import { hotelOpened } from '@/features/booking-check-availability';
import { bookingClosed } from '@/features/booking-create';

export const HotelGate = createGate<{ id: string }>();

sample({ clock: HotelGate.open, fn: ({ id }) => id, target: [detailsRequested, hotelOpened] });
sample({ clock: HotelGate.close, target: [detailsReset, bookingClosed] });
