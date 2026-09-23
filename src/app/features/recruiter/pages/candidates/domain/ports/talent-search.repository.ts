import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DeveloperProfile,
  SavedProfile,
  TalentSearchFilters,
  TalentSearchResult,
} from '@features/recruiter/pages/candidates/domain/models/developer-profile.model';

export interface TalentSearchRepository {
  searchDevelopers(filters: TalentSearchFilters): Observable<TalentSearchResult>;
  savedProfiles(recruiterId: string): Observable<SavedProfile[]>;
  saveDeveloperProfile(recruiterId: string, developerId: string, notes?: string): Observable<SavedProfile>;
  unsaveDeveloperProfile(recruiterId: string, developerId: string): Observable<boolean>;
  isProfileSaved(recruiterId: string, developerId: string): Observable<boolean>;
}

export const TALENT_SEARCH_REPOSITORY = new InjectionToken<TalentSearchRepository>('TalentSearchRepository');

export type { DeveloperProfile, SavedProfile, TalentSearchFilters, TalentSearchResult };
