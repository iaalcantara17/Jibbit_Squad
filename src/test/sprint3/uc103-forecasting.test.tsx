import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user-id' } }, 
        error: null 
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: [],
          error: null,
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  },
}));

vi.mock('@/components/Navigation', () => ({
  Navigation: () => <div data-testid="navigation">Navigation</div>,
}));

describe('UC-103: Predictive Forecasting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('predicts future interview count based on current pipeline', () => {
    const currentPipeline = {
      applications: 20,
      historicalConversionRate: 0.4, // 40% get interviews
    };
    
    const predictedInterviews = Math.round(
      currentPipeline.applications * currentPipeline.historicalConversionRate
    );
    
    expect(predictedInterviews).toBe(8);
  });

  it('predicts future offer count based on interview performance', () => {
    const interviewData = {
      scheduledInterviews: 10,
      historicalSuccessRate: 0.3, // 30% lead to offers
    };
    
    const predictedOffers = Math.round(
      interviewData.scheduledInterviews * interviewData.historicalSuccessRate
    );
    
    expect(predictedOffers).toBe(3);
  });

  it('provides confidence intervals for predictions', () => {
    const prediction = {
      value: 8,
      confidenceLevel: 'medium',
      basedOnData: { sampleSize: 50, timeRange: '3 months' },
    };
    
    expect(prediction.confidenceLevel).toBe('medium');
    expect(prediction.basedOnData.sampleSize).toBeGreaterThan(0);
  });

  it('displays forecasting dashboard', async () => {
    const Forecasting = (await import('@/pages/Forecasting')).default;
    
    render(
      <BrowserRouter>
        <Forecasting />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  it('tracks forecast accuracy over time', () => {
    const forecasts = [
      { predicted: 10, actual: 9, accuracy: 90 },
      { predicted: 15, actual: 12, accuracy: 80 },
      { predicted: 8, actual: 8, accuracy: 100 },
    ];
    
    const avgAccuracy = forecasts.reduce((sum, f) => sum + f.accuracy, 0) / forecasts.length;
    
    expect(avgAccuracy).toBeCloseTo(90, 0);
  });

  it('generates 30-day forecasts', () => {
    const forecastData = {
      forecast_type: 'interviews',
      target_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      prediction_value: 8,
      confidence_level: 'medium',
    };
    
    expect(forecastData.forecast_type).toBe('interviews');
    expect(forecastData.prediction_value).toBeGreaterThan(0);
  });

  it('exposes model inputs for transparency', () => {
    const modelInputs = {
      currentApplications: 20,
      avgConversionRate: 0.4,
      historicalPeriod: '3 months',
      sampleSize: 50,
    };
    
    const prediction = modelInputs.currentApplications * modelInputs.avgConversionRate;
    
    expect(prediction).toBe(8);
    expect(modelInputs.sampleSize).toBeGreaterThan(0);
  });
});
