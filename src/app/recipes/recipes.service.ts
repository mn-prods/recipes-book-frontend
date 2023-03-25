import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  CrudService,
  NullablePartial,
  SortOrder,
} from '../common/crud.service';
import { BaseI } from '../common/interfaces/base.interface';
import { IngredientSearchResult } from '../common/interfaces/nutritionix/search-ingredient-result.interface';
import { PaginatedResult } from '../common/interfaces/paginates-result.interface';
import { Recipe } from '../common/interfaces/recipe.interface';

const endpoint = `${environment.api}/recipes`;

const headers = new HttpHeaders().set('accept', 'application/json');

@Injectable({
  providedIn: 'root',
})
export class RecipesService
  extends CrudService<Recipe>
  implements CrudService<Recipe>
{
  constructor(private http: HttpClient) {
    super();
  }

  get(id: string): Observable<Recipe> {
    return this.http.get<Recipe>(`${endpoint}/${id}`, { headers });
  }

  find(
    filter: Partial<Omit<Recipe, 'ingredients'>>,
    page: number,
    size: number,
    sortField: keyof Recipe,
    sortOrder: SortOrder
  ): Observable<PaginatedResult<Recipe>> {
    const params = this.getPageableParams({
      page,
      size,
      sort: { [sortField]: sortOrder },
    }).appendAll(filter || {});

    return this.http.get<PaginatedResult<Recipe>>(endpoint, {
      headers,
      params,
    });
  }

  save(
    id: string | null | undefined,
    dto: Exclude<NullablePartial<Recipe>, BaseI>
  ): Observable<Recipe> {
    if (!id) {
      return this.http.post<Recipe>(endpoint, dto);
    }
    return this.http.put<Recipe>(`${endpoint}/${id}`, dto, { headers });
  }

  associateIngredient(
    recipeId: string,
    ingredient: Partial<IngredientSearchResult>
  ): Observable<any> {
    return this.http.put(`${endpoint}/${recipeId}/ingredients`, ingredient, {
      headers,
    });
  }

  associateNewIngredient(
    recipeId: string,
    newIngredient: Pick<IngredientSearchResult, 'foodName'>
  ): Observable<any> {
    return this.http.post(
      `${endpoint}/${recipeId}/ingredients`,
      newIngredient,
      { headers }
    );
  }

  removeIngredient(id: string, ingredientId: string): Observable<Recipe> {
    return this.http.delete<Recipe>(`${endpoint}/${id}/ingredients/${ingredientId}`);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${endpoint}/${id}`, { headers });
  }
}
