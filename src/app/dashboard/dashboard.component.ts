import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { PipsResultsService, type PipsResult } from '../services/pips-results/pips-results.service';
import {
  PipsParticipantsService,
  type PipsParticipant,
} from '../services/pips-participants/pips-participants.service';

interface ParticipantStats {
  name: string;
  gamesPlayed: number;
  averageTime: number;
  fastestTime: number;
  slowestTime: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardModule, TableModule, TagModule, SkeletonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly resultsService = inject(PipsResultsService);
  private readonly participantsService = inject(PipsParticipantsService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly rawResults = signal<PipsResult[] | null>(null);
  readonly rawParticipants = signal<PipsParticipant[] | null>(null);
  readonly error = signal<string | null>(null);

  readonly isLoading = computed(
    () => (this.rawResults() === null || this.rawParticipants() === null) && this.error() === null,
  );

  readonly participantStats = computed<ParticipantStats[]>(() => {
    const results = this.rawResults();
    const participants = this.rawParticipants();
    if (!results || !participants) return [];

    const phoneToName = new Map<string, string>(participants.map((p) => [p.phone_number, p.name]));

    const grouped = new Map<string, PipsResult[]>();
    for (const r of results) {
      if (!phoneToName.has(r.sender_phone_number)) continue;
      const group = grouped.get(r.sender_phone_number) ?? [];
      group.push(r);
      grouped.set(r.sender_phone_number, group);
    }

    return Array.from(grouped.entries())
      .map(([phone, games]): ParticipantStats => {
        const times = games.map((g) => g.duration_seconds);
        return {
          name: phoneToName.get(phone)!,
          gamesPlayed: games.length,
          averageTime: Math.round(times.reduce((s, t) => s + t, 0) / times.length),
          fastestTime: Math.min(...times),
          slowestTime: Math.max(...times),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly leaderboardGamesPlayed = computed(() =>
    [...this.participantStats()].sort((a, b) => b.gamesPlayed - a.gamesPlayed),
  );

  readonly leaderboardAvgTime = computed(() =>
    [...this.participantStats()].sort((a, b) => a.averageTime - b.averageTime),
  );

  readonly leaderboardFastest = computed(() =>
    [...this.participantStats()].sort((a, b) => a.fastestTime - b.fastestTime),
  );

  readonly leaderboardSlowest = computed(() =>
    [...this.participantStats()].sort((a, b) => b.slowestTime - a.slowestTime),
  );

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
      this.rawResults.set(results);
      this.rawParticipants.set(participants);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to load data');
    }
  }

  formatTime(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return s === 0 ? `${m}m` : `${m}m ${s}s`;
  }

  tagSeverity(rank: number): 'success' | 'warn' | 'secondary' {
    if (rank === 0) return 'success';
    if (rank === 1) return 'warn';
    return 'secondary';
  }
}
