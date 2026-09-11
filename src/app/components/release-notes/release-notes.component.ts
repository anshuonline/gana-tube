import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';

interface ReleaseNote {
  title: string;
  description: string;
  icon: any; // We'll render the icon based on a string name in the template using ngSwitch, or just hardcode the template for each card. Actually, hardcoding in the template is easier and more robust for lucide SVG directives.
}

@Component({
  selector: 'app-release-notes',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './release-notes.component.html',
  styleUrls: ['./release-notes.component.scss']
})
export class ReleaseNotesComponent {
  
}
