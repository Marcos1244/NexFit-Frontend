import { HttpContextToken } from '@angular/common/http';

export const skipAuthToken = new HttpContextToken<boolean>(() => false);
