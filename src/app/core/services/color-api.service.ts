import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../config/environment';
import { ColorResponse, CreateColorRequest, UpdateColorRequest } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ColorApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/colors`;

  getColors(): Observable<ColorResponse[]> {
    return this.http.get<ColorResponse[]>(this.base);
  }

  getColor(id: number): Observable<ColorResponse> {
    return this.http.get<ColorResponse>(`${this.base}/${id}`);
  }

  createColor(body: CreateColorRequest): Observable<ColorResponse> {
    return this.http.post<ColorResponse>(this.base, body);
  }

  updateColor(id: number, body: UpdateColorRequest): Observable<ColorResponse> {
    return this.http.patch<ColorResponse>(`${this.base}/${id}`, body);
  }

  deleteColor(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
