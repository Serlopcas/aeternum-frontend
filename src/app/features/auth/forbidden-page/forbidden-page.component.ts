import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forbidden-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './forbidden-page.component.html',
  styleUrl: './forbidden-page.component.scss',
})
export class ForbiddenPageComponent {}
