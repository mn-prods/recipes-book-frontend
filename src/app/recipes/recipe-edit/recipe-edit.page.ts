import { Component } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ModalController } from '@ionic/angular';
import {
  debounceTime,
  filter,
  firstValueFrom,
  Observable,
  of,
  switchMap,
  takeUntil
} from 'rxjs';
import { EditComponent } from 'src/app/common/components/edit.abstract.component';
import { IngredientModalDismissRoles } from 'src/app/common/constants';
import { IngredientSearchResult } from 'src/app/common/interfaces/nutritionix/search-ingredient-result.interface';
import { Recipe } from 'src/app/common/interfaces/recipe.interface';
import { IngredientsComponent } from 'src/app/ingredients/ingredients.component';
import { RecipesService } from '../recipes.service';

@Component({
  selector: 'app-recipe-edit',
  templateUrl: './recipe-edit.page.html',
  styleUrls: ['./recipe-edit.page.scss'],
})
export class RecipeEditPage extends EditComponent<Recipe> {
  constructor(
    private modal: ModalController,
    private recipesService: RecipesService,
    protected override route: ActivatedRoute
  ) {
    super(route, recipesService);
  }

  ionViewDidEnter() {
    this.form = new FormGroup({
      body: new FormControl(),
      title: new FormControl(),
      servings: new FormControl(),
      ingredients: new FormControl(),
    });

    this.retrieveEntityById()
      .pipe(
        switchMap((recipe) => {
          if (!recipe || !this.form) {
            return of(null);
          }

          this.setValueOnRecipeFetched(recipe);

          return this.form.valueChanges.pipe(
            takeUntil(this.unsubscribe$),
            debounceTime(200)
          );
        }),
        filter(Boolean),
        switchMap((value) => {
          return this.recipesService.save(this.entity?.id, value);
        })
      )
      .subscribe();
  }

  public async openIngredientsList() {
    const modal = await this.modal.create({
      component: IngredientsComponent,
      initialBreakpoint: 0.75,
    });
    await modal.present();

    const { data, role } = await modal.onDidDismiss<IngredientSearchResult>();
    const recipeId = this.entity?.id as string;
    const ingredient = data as IngredientSearchResult;

    let associationResult: Observable<any>;
    if (role === IngredientModalDismissRoles.create) {
      associationResult = this.recipesService.associateNewIngredient(
        recipeId,
        ingredient
      );
    } else {
      associationResult = this.recipesService.associateIngredient(
        recipeId,
        ingredient
      );
    }

    await firstValueFrom(associationResult);
    await firstValueFrom(this.retrieveEntityById());
  }

  private setValueOnRecipeFetched(recipe: Recipe) {
    this.form?.setValue(
      {
        body: recipe?.body,
        title: recipe?.title,
        servings: recipe?.servings,
        ingredients: recipe?.ingredients,
      },
      { emitEvent: false }
    );
  }

  public removeIngredient(ingredientId: string) {
    if (!this.entity?.id) {
      return;
    }

    this.recipesService
      .removeIngredient(this.entity?.id, ingredientId)
      .pipe(
        switchMap(() => this.retrieveEntityById()),
        filter(Boolean)
      )
      .subscribe({
        next: (recipe) => this.setValueOnRecipeFetched(recipe),
      });
  }

  ionViewWillLeave() {
    this.unsubscribe$?.next(null);
    this.unsubscribe$?.complete();
  }
}
