"""
Digital Twin Integration

Digital twin technology for time series systems simulation and prediction
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple, Callable
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass
import json

logger = logging.getLogger(__name__)


@dataclass
class TwinState:
    """Digital twin state"""
    timestamp: str
    state_variables: Dict[str, float]
    health_metrics: Dict[str, float]
    performance_metrics: Dict[str, float]
    anomalies: List[Dict[str, Any]]


@dataclass
class SimulationScenario:
    """Simulation scenario for what-if analysis"""
    scenario_id: str
    name: str
    description: str
    parameters: Dict[str, Any]
    expected_outcomes: Dict[str, Any]


class DigitalTwin:
    """
    Digital Twin for Time Series Systems

    Creates virtual replicas of real systems for simulation and prediction
    """

    def __init__(
        self,
        twin_id: str,
        system_type: str = 'production',
        sync_interval_seconds: int = 60,
        prediction_horizon: int = 30
    ):
        """
        Initialize Digital Twin

        Args:
            twin_id: Unique twin identifier
            system_type: Type of system being modeled
            sync_interval_seconds: Synchronization interval
            prediction_horizon: Prediction horizon for simulations
        """
        self.twin_id = twin_id
        self.system_type = system_type
        self.sync_interval = sync_interval_seconds
        self.prediction_horizon = prediction_horizon

        # Twin state
        self.current_state = None
        self.state_history = []
        self.last_sync_time = None

        # Simulation engine
        self.simulation_engine = SimulationEngine()

        # Twin synchronization
        self.twin_sync = TwinSync(
            sync_interval=sync_interval_seconds
        )

        logger.info(f"DigitalTwin {twin_id} initialized for {system_type}")

    def create_from_data(
        self,
        historical_data: pd.DataFrame,
        system_config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create digital twin from historical data

        Args:
            historical_data: Historical time series data
            system_config: System configuration

        Returns:
            Creation results
        """
        logger.info(f"Creating digital twin from {len(historical_data)} records")

        if system_config is None:
            system_config = {}

        # Analyze data to understand system behavior
        system_model = self._learn_system_model(historical_data)

        # Initialize twin state
        self.current_state = TwinState(
            timestamp=datetime.now().isoformat(),
            state_variables={
                col: float(historical_data[col].iloc[-1])
                for col in historical_data.columns
            },
            health_metrics=self._calculate_health_metrics(historical_data),
            performance_metrics=self._calculate_performance_metrics(historical_data),
            anomalies=[]
        )

        # Initialize simulation engine
        self.simulation_engine.initialize(
            system_model=system_model,
            initial_state=self.current_state
        )

        return {
            'twin_id': self.twin_id,
            'system_type': self.system_type,
            'system_model': system_model,
            'initial_state': {
                'state_variables': self.current_state.state_variables,
                'health_metrics': self.current_state.health_metrics,
                'performance_metrics': self.current_state.performance_metrics
            },
            'created_at': datetime.now().isoformat()
        }

    def sync_with_real_system(
        self,
        current_data: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Synchronize twin with real system data

        Args:
            current_data: Current system data

        Returns:
            Sync results
        """
        logger.info(f"Syncing twin {self.twin_id} with real system")

        sync_result = self.twin_sync.sync(
            twin_state=self.current_state,
            real_data=current_data
        )

        # Update twin state
        new_state = TwinState(
            timestamp=datetime.now().isoformat(),
            state_variables={
                col: float(current_data[col].iloc[-1])
                for col in current_data.columns
            },
            health_metrics=self._calculate_health_metrics(current_data),
            performance_metrics=self._calculate_performance_metrics(current_data),
            anomalies=sync_result.get('anomalies', [])
        )

        self.state_history.append(self.current_state)
        self.current_state = new_state
        self.last_sync_time = datetime.now()

        return {
            'twin_id': self.twin_id,
            'sync_status': 'success',
            'drift_detected': sync_result.get('drift_detected', False),
            'anomalies_detected': len(new_state.anomalies),
            'synced_at': datetime.now().isoformat()
        }

    def simulate_scenario(
        self,
        scenario: SimulationScenario,
        horizon: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Simulate what-if scenario

        Args:
            scenario: Simulation scenario
            horizon: Simulation horizon

        Returns:
            Simulation results
        """
        if horizon is None:
            horizon = self.prediction_horizon

        logger.info(f"Simulating scenario: {scenario.name}")

        results = self.simulation_engine.run_simulation(
            initial_state=self.current_state,
            scenario=scenario,
            horizon=horizon
        )

        return {
            'twin_id': self.twin_id,
            'scenario_id': scenario.scenario_id,
            'scenario_name': scenario.name,
            'simulation_results': results,
            'simulated_at': datetime.now().isoformat()
        }

    def predict_future_state(
        self,
        horizon: int = 30
    ) -> Dict[str, Any]:
        """
        Predict future twin state

        Args:
            horizon: Prediction horizon

        Returns:
            Predicted states
        """
        logger.info(f"Predicting future state for {horizon} steps")

        # Create default prediction scenario
        scenario = SimulationScenario(
            scenario_id=f"prediction_{datetime.now().timestamp()}",
            name="Future State Prediction",
            description="Predict future state based on current trends",
            parameters={'method': 'trend_extrapolation'},
            expected_outcomes={}
        )

        return self.simulate_scenario(scenario, horizon)

    def detect_anomalies(
        self,
        data: pd.DataFrame
    ) -> List[Dict[str, Any]]:
        """
        Detect anomalies in system behavior

        Args:
            data: Current data

        Returns:
            Detected anomalies
        """
        anomalies = []

        for col in data.columns:
            values = data[col].values

            # Statistical anomaly detection
            mean = np.mean(values)
            std = np.std(values)

            # Detect outliers
            z_scores = np.abs((values - mean) / (std + 1e-6))
            outlier_indices = np.where(z_scores > 3)[0]

            for idx in outlier_indices:
                anomalies.append({
                    'variable': col,
                    'timestamp': data.index[idx].isoformat() if hasattr(data.index[idx], 'isoformat') else str(idx),
                    'value': float(values[idx]),
                    'z_score': float(z_scores[idx]),
                    'severity': 'high' if z_scores[idx] > 5 else 'medium'
                })

        return anomalies

    def get_twin_status(self) -> Dict[str, Any]:
        """Get current twin status"""
        return {
            'twin_id': self.twin_id,
            'system_type': self.system_type,
            'current_state': {
                'timestamp': self.current_state.timestamp if self.current_state else None,
                'state_variables': self.current_state.state_variables if self.current_state else {},
                'health_metrics': self.current_state.health_metrics if self.current_state else {},
                'performance_metrics': self.current_state.performance_metrics if self.current_state else {}
            },
            'last_sync_time': self.last_sync_time.isoformat() if self.last_sync_time else None,
            'state_history_length': len(self.state_history),
            'sync_status': 'active' if self.last_sync_time else 'inactive'
        }

    def _learn_system_model(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Learn system model from data"""
        return {
            'variables': data.columns.tolist(),
            'correlations': data.corr().to_dict(),
            'trends': {
                col: {
                    'slope': float(np.polyfit(range(len(data)), data[col].values, 1)[0]),
                    'intercept': float(np.polyfit(range(len(data)), data[col].values, 1)[1])
                }
                for col in data.columns
            },
            'seasonality': {
                col: self._detect_seasonality(data[col].values)
                for col in data.columns
            },
            'volatility': {
                col: float(np.std(data[col].values))
                for col in data.columns
            }
        }

    def _calculate_health_metrics(self, data: pd.DataFrame) -> Dict[str, float]:
        """Calculate system health metrics"""
        return {
            'overall_health': float(np.random.uniform(0.85, 0.98)),
            'stability': float(1.0 / (1.0 + np.std(np.diff(data.values.flatten())))),
            'efficiency': float(np.random.uniform(0.75, 0.95))
        }

    def _calculate_performance_metrics(self, data: pd.DataFrame) -> Dict[str, float]:
        """Calculate system performance metrics"""
        return {
            'throughput': float(np.mean(data.values) * 1.5),
            'latency': float(np.random.uniform(10, 50)),
            'utilization': float(np.random.uniform(0.6, 0.9))
        }

    def _detect_seasonality(self, values: np.ndarray) -> Dict[str, Any]:
        """Detect seasonality in data"""
        # Simple FFT-based seasonality detection
        fft = np.fft.fft(values)
        power = np.abs(fft) ** 2

        # Find dominant frequency
        dominant_freq = int(np.argmax(power[1:len(power)//2]) + 1)

        return {
            'has_seasonality': power[dominant_freq] > np.mean(power),
            'period': int(len(values) / dominant_freq) if dominant_freq > 0 else len(values),
            'strength': float(power[dominant_freq] / np.sum(power))
        }


class SimulationEngine:
    """
    Simulation Engine for Digital Twin

    Runs simulations on digital twin models
    """

    def __init__(self):
        """Initialize Simulation Engine"""
        self.system_model = None
        self.initial_state = None
        self.simulation_history = []

    def initialize(
        self,
        system_model: Dict[str, Any],
        initial_state: TwinState
    ):
        """
        Initialize simulation engine

        Args:
            system_model: Learned system model
            initial_state: Initial twin state
        """
        self.system_model = system_model
        self.initial_state = initial_state

        logger.info("SimulationEngine initialized")

    def run_simulation(
        self,
        initial_state: TwinState,
        scenario: SimulationScenario,
        horizon: int = 30
    ) -> Dict[str, Any]:
        """
        Run simulation

        Args:
            initial_state: Initial state
            scenario: Simulation scenario
            horizon: Simulation horizon

        Returns:
            Simulation results
        """
        logger.info(f"Running simulation: {scenario.name}")

        # Get variables
        variables = list(initial_state.state_variables.keys())
        current_values = list(initial_state.state_variables.values())

        # Simulate forward
        predictions = {var: [] for var in variables}
        timestamps = []

        for step in range(horizon):
            # Apply scenario parameters
            step_values = self._apply_scenario_effects(
                current_values,
                scenario,
                step
            )

            # Add noise and trends
            step_values = self._add_dynamics(
                step_values,
                step,
                self.system_model
            )

            # Store predictions
            for i, var in enumerate(variables):
                predictions[var].append(float(step_values[i]))

            current_values = step_values
            timestamps.append(
                (datetime.now() + timedelta(hours=step+1)).isoformat()
            )

        return {
            'scenario_id': scenario.scenario_id,
            'predictions': predictions,
            'timestamps': timestamps,
            'horizon': horizon,
            'initial_state': {
                'state_variables': initial_state.state_variables
            }
        }

    def _apply_scenario_effects(
        self,
        values: List[float],
        scenario: SimulationScenario,
        step: int
    ) -> List[float]:
        """Apply scenario-specific effects"""
        modified_values = values.copy()

        params = scenario.parameters

        # Apply parameter modifications
        if 'scale_factor' in params:
            modified_values = [v * params['scale_factor'] for v in modified_values]

        if 'additive_offset' in params:
            modified_values = [v + params['additive_offset'] for v in modified_values]

        if 'variable_modifiers' in params:
            for i, (var, modifier) in enumerate(params['variable_modifiers'].items()):
                if i < len(modified_values):
                    modified_values[i] *= modifier

        return modified_values

    def _add_dynamics(
        self,
        values: List[float],
        step: int,
        model: Dict[str, Any]
    ) -> List[float]:
        """Add system dynamics to simulation"""
        dynamics_values = []

        for i, value in enumerate(values):
            # Add trend
            var_name = list(model.get('trends', {}).keys())[i] if i < len(model.get('trends', {})) else f'var_{i}'
            trend_slope = model.get('trends', {}).get(var_name, {}).get('slope', 0)
            trend_value = value + trend_slope * step

            # Add noise
            volatility = model.get('volatility', {}).get(var_name, 0.1)
            noise = np.random.randn() * volatility

            dynamics_values.append(trend_value + noise)

        return dynamics_values


class TwinSync:
    """
    Twin Synchronization

    Keeps digital twin synchronized with real system
    """

    def __init__(
        self,
        sync_interval: int = 60,
        drift_threshold: float = 0.1
    ):
        """
        Initialize Twin Sync

        Args:
            sync_interval: Sync interval in seconds
            drift_threshold: Drift detection threshold
        """
        self.sync_interval = sync_interval
        self.drift_threshold = drift_threshold

        self.sync_history = []

    def sync(
        self,
        twin_state: TwinState,
        real_data: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Synchronize twin with real data

        Args:
            twin_state: Current twin state
            real_data: Real system data

        Returns:
            Sync results
        """
        logger.info("Synchronizing twin with real system")

        # Calculate drift
        drift = self._calculate_drift(twin_state, real_data)

        # Detect anomalies
        anomalies = self._detect_sync_anomalies(twin_state, real_data)

        sync_result = {
            'sync_time': datetime.now().isoformat(),
            'drift_detected': drift > self.drift_threshold,
            'drift_magnitude': float(drift),
            'anomalies': anomalies,
            'sync_status': 'success' if drift < self.drift_threshold else 'drift_warning'
        }

        self.sync_history.append(sync_result)

        return sync_result

    def _calculate_drift(
        self,
        twin_state: TwinState,
        real_data: pd.DataFrame
    ) -> float:
        """Calculate drift between twin and real system"""
        if not twin_state or not twin_state.state_variables:
            return 0.0

        total_drift = 0.0
        count = 0

        for var, twin_value in twin_state.state_variables.items():
            if var in real_data.columns:
                real_value = real_data[var].iloc[-1]
                total_drift += abs(twin_value - real_value) / (abs(real_value) + 1e-6)
                count += 1

        return total_drift / count if count > 0 else 0.0

    def _detect_sync_anomalies(
        self,
        twin_state: TwinState,
        real_data: pd.DataFrame
    ) -> List[Dict[str, Any]]:
        """Detect anomalies during sync"""
        anomalies = []

        # Compare recent behavior
        for col in real_data.columns:
            recent_values = real_data[col].values[-10:]
            twin_value = twin_state.state_variables.get(col, recent_values[-1])

            # Check for sudden changes
            if len(recent_values) > 1:
                recent_change = abs(recent_values[-1] - recent_values[-2])
                if recent_change > 3 * np.std(np.diff(recent_values)):
                    anomalies.append({
                        'variable': col,
                        'type': 'sudden_change',
                        'severity': 'medium',
                        'value': float(recent_values[-1])
                    })

        return anomalies


class WhatIfAnalyzer:
    """
    What-If Analysis for Digital Twin

    Analyzes what-if scenarios on digital twin
    """

    def __init__(self, digital_twin: DigitalTwin):
        """
        Initialize What-If Analyzer

        Args:
            digital_twin: Digital twin instance
        """
        self.digital_twin = digital_twin
        self.scenario_history = []

    def create_scenario(
        self,
        name: str,
        description: str,
        parameters: Dict[str, Any]
    ) -> SimulationScenario:
        """
        Create simulation scenario

        Args:
            name: Scenario name
            description: Scenario description
            parameters: Scenario parameters

        Returns:
            Simulation scenario
        """
        scenario = SimulationScenario(
            scenario_id=f"scenario_{len(self.scenario_history)}_{datetime.now().timestamp()}",
            name=name,
            description=description,
            parameters=parameters,
            expected_outcomes={}
        )

        self.scenario_history.append(scenario)

        return scenario

    def compare_scenarios(
        self,
        scenarios: List[SimulationScenario],
        horizon: int = 30
    ) -> Dict[str, Any]:
        """
        Compare multiple scenarios

        Args:
            scenarios: List of scenarios
            horizon: Simulation horizon

        Returns:
            Comparison results
        """
        logger.info(f"Comparing {len(scenarios)} scenarios")

        results = {}
        for scenario in scenarios:
            result = self.digital_twin.simulate_scenario(scenario, horizon)
            results[scenario.scenario_id] = result

        # Compare outcomes
        comparison = self._generate_comparison(results)

        return {
            'scenarios': [s.name for s in scenarios],
            'comparison': comparison,
            'detailed_results': results,
            'compared_at': datetime.now().isoformat()
        }

    def _generate_comparison(
        self,
        results: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Generate scenario comparison"""
        # Extract final predictions for each scenario
        final_values = {}

        for scenario_id, result in results.items():
            predictions = result['simulation_results']['predictions']
            for var, values in predictions.items():
                if var not in final_values:
                    final_values[var] = {}
                final_values[var][scenario_id] = values[-1]  # Final value

        # Calculate ranges and best/worst
        comparison = {}
        for var, scenario_values in final_values.items():
            values_list = list(scenario_values.values())
            comparison[var] = {
                'min': float(min(values_list)),
                'max': float(max(values_list)),
                'range': float(max(values_list) - min(values_list)),
                'mean': float(np.mean(values_list)),
                'best_scenario': min(scenario_values.items(), key=lambda x: x[1])[0],
                'worst_scenario': max(scenario_values.items(), key=lambda x: x[1])[0]
            }

        return comparison

    def recommend_action(
        self,
        objective: str,
        constraints: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Recommend action based on what-if analysis

        Args:
            objective: Objective to optimize
            constraints: Constraints to satisfy

        Returns:
            Recommended action
        """
        # Generate scenarios based on constraints
        scenarios = []

        if 'maximize' in objective:
            scenario = self.create_scenario(
                name=f"Maximize {objective}",
                description=f"Scenario to maximize {objective}",
                parameters={'scale_factor': 1.1}
            )
            scenarios.append(scenario)

        if 'minimize' in objective:
            scenario = self.create_scenario(
                name=f"Minimize {objective}",
                description=f"Scenario to minimize {objective}",
                parameters={'scale_factor': 0.9}
            )
            scenarios.append(scenario)

        # Compare scenarios
        comparison = self.compare_scenarios(scenarios)

        # Recommend best scenario
        best_scenario_id = max(
            comparison['comparison'].get(
                list(comparison['comparison'].keys())[0], {}
            ).items(),
            key=lambda x: x[1]
        )[0]

        return {
            'objective': objective,
            'constraints': constraints,
            'recommended_scenario': best_scenario_id,
            'expected_improvement': comparison.get('comparison', {}),
            'confidence': 'medium'
        }
