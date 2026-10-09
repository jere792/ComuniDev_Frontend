import { Injectable, inject } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StoryCategory } from '@features/recruiter/pages/profile/domain/models/story-category.model';
import {
  CategoryRepository,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@features/recruiter/pages/profile/domain/ports/category.repository';

const CATEGORY_FIELDS = `
  id
  userId
  nombre
  descripcion
  icono
  color
  orden
  activa
  createdAt
  updatedAt
`;

const GET_CATEGORIES = gql`
  query GetCategories($userId: String!) {
    categories(userId: $userId) {
      ${CATEGORY_FIELDS}
    }
  }
`;

const CREATE_CATEGORY = gql`
  mutation CreateCategory(
    $userId: String!
    $nombre: String!
    $descripcion: String
    $icono: String
    $color: String
    $orden: Int
  ) {
    createCategory(
      userId: $userId
      nombre: $nombre
      descripcion: $descripcion
      icono: $icono
      color: $color
      orden: $orden
    ) {
      ${CATEGORY_FIELDS}
    }
  }
`;

const UPDATE_CATEGORY = gql`
  mutation UpdateCategory(
    $id: ID!
    $nombre: String
    $descripcion: String
    $icono: String
    $color: String
    $orden: Int
    $activa: Boolean
  ) {
    updateCategory(
      id: $id
      nombre: $nombre
      descripcion: $descripcion
      icono: $icono
      color: $color
      orden: $orden
      activa: $activa
    ) {
      ${CATEGORY_FIELDS}
    }
  }
`;

const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: ID!) {
    deleteCategory(id: $id)
  }
`;

@Injectable({ providedIn: 'root' })
export class CategoryGraphqlService implements CategoryRepository {
  private apollo = inject(Apollo);

  getByUser(userId: string): Observable<StoryCategory[]> {
    return this.apollo
      .watchQuery<any>({ query: GET_CATEGORIES, variables: { userId }, fetchPolicy: 'network-only' })
      .valueChanges.pipe(map(result => result.data?.categories ?? []));
  }

  create(data: CreateCategoryRequest): Observable<StoryCategory> {
    return this.apollo
      .mutate<any>({ mutation: CREATE_CATEGORY, variables: data })
      .pipe(map(result => result.data?.createCategory));
  }

  update(id: string, data: UpdateCategoryRequest): Observable<StoryCategory | null> {
    return this.apollo
      .mutate<any>({ mutation: UPDATE_CATEGORY, variables: { id, ...data } })
      .pipe(map(result => result.data?.updateCategory ?? null));
  }

  delete(id: string): Observable<boolean> {
    return this.apollo
      .mutate<any>({ mutation: DELETE_CATEGORY, variables: { id } })
      .pipe(map(result => result.data?.deleteCategory ?? false));
  }
}
