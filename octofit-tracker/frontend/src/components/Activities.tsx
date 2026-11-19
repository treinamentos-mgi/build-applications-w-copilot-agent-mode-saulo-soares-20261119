import { CapabilityCard } from './CapabilityCard.js';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };
type ActivityResponse = { activities: Activity[] };

const loadActivities = (path: string) => getJson<ActivityResponse>(path);

const activityLabels: Record<string, string> = {
  run: 'Corrida',
  cycle: 'Ciclismo',
  walk: 'Caminhada',
  strength: 'Treino de força',
};

export default function Activities() {
  return (
    <CapabilityCard<ActivityResponse>
      title="Atividades"
      description="Acompanhe os minutos de atividade e os pontos das pessoas participantes."
      path="/api/activities"
      load={loadActivities}
      emptyText="Sem atividades registradas."
      hasData={({ activities }) => activities.length > 0}
      render={({ activities }) => (
        <ul className="list-group list-group-flush" aria-label="Atividades registradas">
          {activities.map((activity, index) => (
            <li className="list-group-item px-0" key={`${activity.type}-${index}`}>
              {activityLabels[activity.type] ?? activity.type} · {activity.minutes} min · {activity.points} pontos
            </li>
          ))}
        </ul>
      )}
    />
  );
}
