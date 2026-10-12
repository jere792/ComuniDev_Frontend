import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  signal,
} from '@angular/core';
import { DeveloperProfile } from '@features/recruiter/pages/candidates/domain/models/developer-profile.model';

export interface CandidateBlock {
  key: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-candidate-block',
  standalone: true,
  templateUrl: './candidate-block.html',
  styleUrl: './candidate-block.scss',
})
export class CandidateBlockCard implements AfterViewChecked {
  @Input({ required: true }) block!: CandidateBlock;
  @Input({ required: true }) dev!: DeveloperProfile;
  @Input() salary: string | null = null;
  @Input() expandable = true;
  @Input() bare = false;

  @Output() expand = new EventEmitter<void>();

  @ViewChild('contentEl') private contentEl?: ElementRef<HTMLElement>;

  readonly overflowing = signal(false);

  ngAfterViewChecked(): void {
    this.checkOverflow();
  }

  private checkOverflow(): void {
    if (!this.expandable) {
      if (this.overflowing()) this.overflowing.set(false);
      return;
    }
    const el = this.contentEl?.nativeElement;
    if (!el) return;
    const over = el.scrollHeight - el.clientHeight > 4;
    if (over !== this.overflowing()) this.overflowing.set(over);
  }
}
