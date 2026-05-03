import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { SkeletonModule } from 'primeng/skeleton';
import { ChartModule } from 'primeng/chart';
import {
  PipsResultsService,
  type PipsResult,
} from '../services/pips-results/pips-results.service';
import { PipsParticipantsService } from '../services/pips-participants/pips-participants.service';

@Component({
  selector: 'app-participant-detail',
  standalone: true,
  imports: [CardModule, TableModule, SkeletonModule, ChartModule],
  templateUrl: './participant-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantDetailComponent {
  private readonly resultsService = inject(PipsResultsService);
  private readonly participantsService = inject(PipsParticipantsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly participantName = this.route.snapshot.paramMap.get('name') ?? '';

  readonly rawResults = signal<PipsResult[] | null>(null);
  readonly error = signal<string | null>(null);

  readonly isLoading = computed(
    () => this.rawResults() === null && this.error() === null,
  );

  readonly games = computed(() => {
    const results = this.rawResults();
    if (!results) return [];
    return [...results].sort((a, b) => a.pips_number - b.pips_number);
  });

  readonly gamesDesc = computed(() => [...this.games()].reverse());

  readonly stats = computed(() => {
    const games = this.games();
    if (games.length === 0) return null;
    const times = games.map((g) => g.duration_seconds);
    return {
      gamesPlayed: games.length,
      averageTime: Math.round(times.reduce((s, t) => s + t, 0) / times.length),
      fastestTime: Math.min(...times),
      slowestTime: Math.max(...times),
    };
  });

  readonly chartData = computed(() => {
    const games = this.games();
    if (games.length === 0) return null;
    return {
      labels: games.map((g) => `#${g.pips_number}`),
      datasets: [
        {
          label: 'Completion Time',
          data: games.map((g) => g.duration_seconds),
          fill: true,
          tension: 0.3,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.08)',
          pointBackgroundColor: '#6366f1',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    };
  });

  readonly chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: { parsed: { y: number } }) => ` ${this.formatTime(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 12 },
      },
      y: {
        beginAtZero: false,
        grid: { color: 'rgba(0,0,0,0.05)' },
        ticks: {
          callback: (value: number | string) => {
            const n = Number(value);
            return isNaN(n) ? String(value) : this.formatTime(n);
          },
        },
      },
    },
  };

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      void this.loadData();
    }
  }

  private async loadData(): Promise<void> {
    try {
      const [results, participants] = await Promise.all([
        this.resultsService.getAll(),
        this.participantsService.getAll(),
      ]);

      const participant = participants.find((p) => p.name === this.participantName);
      if (!participant) {
        this.error.set('Participant not found');
        return;
      }

      this.rawResults.set(
        results.filter((r) => r.sender_phone_number === participant.phone_number),
      );
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load data');
    }
  }

  goBack(): void {
    void this.router.navigate(['/']);
  }

  formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s === 0 ? `${m}m` : `${m}m ${s}s`;
  }
}
