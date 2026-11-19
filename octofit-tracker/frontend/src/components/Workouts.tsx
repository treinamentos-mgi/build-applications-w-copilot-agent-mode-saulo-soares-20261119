import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type WorkoutSuggestion = { title: string; focus: string; minutes: number; difficulty: string; reason: string };
type WorkoutResponse = { suggestions: WorkoutSuggestion[] };

const loadWorkouts = (path: string) => getJson<WorkoutResponse>(path);

export default function Workouts() {
  const userEmail = 'mona@example.com';
  return (
    <CapabilityCard<WorkoutResponse>
      title="Sugestões de treino"
      description="Recomendações baseadas nas metas e atividades recentes."
      path={`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`}
      load={loadWorkouts}
      emptyText="Nenhuma sugestão de treino disponível."
      hasData={({ suggestions }) => suggestions.length > 0}
      render={({ suggestions }) => (
        <ul className="list-group list-group-flush" aria-label="Treinos recomendados">
          {suggestions.map((suggestion) => (
            <li className="list-group-item px-0" key={suggestion.title}>
              <h3 className="h6 mb-1">{suggestion.title}</h3>
              <p className="mb-1">{suggestion.minutes} min · {suggestion.difficulty}</p>
              <p className="mb-0">{suggestion.reason}</p>
            </li>
          ))}
        </ul>
      )}
    />
  );
}
