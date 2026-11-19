import { useEffect, useState, type ReactNode } from 'react';

type Props<T> = {
  title: string;
  description: string;
  path: string;
  load(path: string): Promise<T>;
  emptyText: string;
  hasData(data: T): boolean;
  render(data: T): ReactNode;
};

type ResourceState<T> =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; data: T };

export function CapabilityCard<T>({ title, description, path, load, emptyText, hasData, render }: Props<T>) {
  const [state, setState] = useState<ResourceState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    load(path)
      .then((data) => {
        if (active) setState({ status: 'success', data });
      })
      .catch(() => {
        if (active) setState({ status: 'error' });
      });
    return () => {
      active = false;
    };
  }, [path, load]);

  return (
    <section className="card h-100" aria-labelledby="capability-title">
      <div className="card-body">
        <h2 className="h4" id="capability-title">{title}</h2>
        <p>{description}</p>
        {state.status === 'loading' && <p role="status">Carregando...</p>}
        {state.status === 'error' && <p className="alert alert-danger" role="alert">Não foi possível carregar os dados. Tente novamente.</p>}
        {state.status === 'success' && !hasData(state.data) && <p role="status">{emptyText}</p>}
        {state.status === 'success' && hasData(state.data) && render(state.data)}
      </div>
    </section>
  );
}
