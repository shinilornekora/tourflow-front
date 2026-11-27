import { sample } from 'effector';
import { searchSubmitted } from '@/features/booking-check-availability';
import { bookingSucceeded } from '@/features/booking-create';

// После брони остатки изменились — перезапрашиваем доступность.
sample({ clock: bookingSucceeded, target: searchSubmitted });
