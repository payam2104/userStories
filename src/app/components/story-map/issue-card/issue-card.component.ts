import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDrag, DragDropModule } from '@angular/cdk/drag-drop';
import { Issue } from '../../../core/model/issue.model';

@Component({
  selector: 'app-issue-card',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './issue-card.component.html',
  styleUrls: ['./issue-card.component.scss']
})
export class IssueCardComponent {
  @Input({ required: true }) issue!: Issue;
}
