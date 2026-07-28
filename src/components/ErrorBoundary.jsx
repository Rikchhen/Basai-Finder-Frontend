import { Component } from 'react';
import styled from 'styled-components';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { Button } from './ui/Button.jsx';

// Without this, a single render error unmounts the whole tree and leaves a
// blank white page. Wrap the app once, and each page again, so a broken page
// keeps the surrounding navigation usable.
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep a breadcrumb in the console for local debugging.
    console.error('Render error caught by ErrorBoundary:', error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <Panel role="alert">
        <IconTile>
          <TriangleAlert size={26} />
        </IconTile>
        <h2>{this.props.title || 'Something went wrong'}</h2>
        <p>
          This part of Basai Finder failed to load. You can retry, or move to another page using the
          navigation.
        </p>
        {import.meta.env.DEV ? <Details>{String(error?.message || error)}</Details> : null}
        <Button type="button" onClick={this.handleReset}>
          <RefreshCw size={16} /> Try again
        </Button>
      </Panel>
    );
  }
}

const Panel = styled.div`
  display: grid;
  justify-items: center;
  gap: ${({ theme }) => theme.spacing(1.5)};
  max-width: 560px;
  margin: ${({ theme }) => theme.spacing(6)} auto;
  border: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  padding: ${({ theme }) => theme.spacing(4)};
  text-align: center;

  h2 {
    margin: 0;
    color: ${({ theme }) => theme.colors.primary};
    font-size: 1.4rem;
    letter-spacing: 0;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
    line-height: 1.6;
  }
`;

const IconTile = styled.span`
  display: grid;
  width: 56px;
  height: 56px;
  place-items: center;
  border-radius: 50%;
  background: rgba(186, 26, 26, 0.1);
  color: ${({ theme }) => theme.colors.error};
`;

const Details = styled.pre`
  max-width: 100%;
  overflow-x: auto;
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ theme }) => theme.colors.surfaceContainerLow};
  padding: ${({ theme }) => theme.spacing(1.25)};
  color: ${({ theme }) => theme.colors.error};
  font-size: 0.8rem;
  text-align: left;
  white-space: pre-wrap;
`;
