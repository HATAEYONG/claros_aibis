"""
Multi-Agent System for Forecasting

Distributed intelligent agents for collaborative time series forecasting
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple, Callable
from datetime import datetime
import logging
from dataclasses import dataclass
from enum import Enum
import json

logger = logging.getLogger(__name__)


class AgentRole(Enum):
    """Agent roles in the system"""
    FORECASTER = "forecaster"
    ANALYZER = "analyzer"
    OPTIMIZER = "optimizer"
    VALIDATOR = "validator"
    COORDINATOR = "coordinator"


@dataclass
class AgentMessage:
    """Message between agents"""
    sender: str
    receiver: str
    message_type: str
    content: Dict[str, Any]
    timestamp: str


@dataclass
class AgentState:
    """Agent state information"""
    agent_id: str
    role: AgentRole
    status: str
    performance: float
    last_update: str
    metadata: Dict[str, Any]


class AgentCommunication:
    """
    Agent Communication System

    Handles message passing between agents
    """

    def __init__(self):
        """Initialize communication system"""
        self.message_queue = []
        self.message_history = []
        self.agent_registry = {}

    def register_agent(self, agent_id: str, agent_role: AgentRole):
        """Register an agent"""
        self.agent_registry[agent_id] = {
            'role': agent_role,
            'registered_at': datetime.now().isoformat()
        }

    def send_message(
        self,
        sender: str,
        receiver: str,
        message_type: str,
        content: Dict[str, Any]
    ) -> bool:
        """
        Send message from one agent to another

        Args:
            sender: Sender agent ID
            receiver: Receiver agent ID
            message_type: Message type
            content: Message content

        Returns:
            Success status
        """
        message = AgentMessage(
            sender=sender,
            receiver=receiver,
            message_type=message_type,
            content=content,
            timestamp=datetime.now().isoformat()
        )

        self.message_queue.append(message)
        self.message_history.append(message)

        logger.debug(f"Message from {sender} to {receiver}: {message_type}")

        return True

    def receive_messages(self, agent_id: str) -> List[AgentMessage]:
        """Receive messages for an agent"""
        messages = [
            msg for msg in self.message_queue
            if msg.receiver == agent_id
        ]
        # Clear received messages
        self.message_queue = [
            msg for msg in self.message_queue
            if msg.receiver != agent_id
        ]
        return messages

    def broadcast(
        self,
        sender: str,
        message_type: str,
        content: Dict[str, Any]
    ) -> int:
        """
        Broadcast message to all agents

        Args:
            sender: Sender agent ID
            message_type: Message type
            content: Message content

        Returns:
            Number of agents notified
        """
        count = 0
        for agent_id in self.agent_registry:
            if agent_id != sender:
                self.send_message(sender, agent_id, message_type, content)
                count += 1
        return count

    def get_communication_stats(self) -> Dict[str, Any]:
        """Get communication statistics"""
        message_types = {}
        for msg in self.message_history:
            message_types[msg.message_type] = message_types.get(msg.message_type, 0) + 1

        return {
            'total_messages': len(self.message_history),
            'queued_messages': len(self.message_queue),
            'registered_agents': len(self.agent_registry),
            'message_types': message_types
        }


class ForecastingAgent:
    """
    Individual Forecasting Agent

    Specialized agent for time series forecasting
    """

    def __init__(
        self,
        agent_id: str,
        model_type: str = 'lstm',
        specialization: Optional[str] = None
    ):
        """
        Initialize Forecasting Agent

        Args:
            agent_id: Unique agent identifier
            model_type: Type of model ('lstm', 'gru', 'transformer', 'arima')
            specialization: Specialization (e.g., 'short_term', 'seasonal', 'trend')
        """
        self.agent_id = agent_id
        self.model_type = model_type
        self.specialization = specialization
        self.role = AgentRole.FORECASTER

        # Agent state
        self.state = AgentState(
            agent_id=agent_id,
            role=self.role,
            status='idle',
            performance=0.0,
            last_update=datetime.now().isoformat(),
            metadata={'model_type': model_type, 'specialization': specialization}
        )

        # Agent's model
        self.model = None
        self.training_history = []

        # Communication
        self.communication = None

        logger.info(f"ForecastingAgent {agent_id} initialized with {model_type}")

    def set_communication(self, communication: AgentCommunication):
        """Set communication system"""
        self.communication = communication
        self.communication.register_agent(self.agent_id, self.role)

    def train(
        self,
        data: pd.DataFrame,
        target_col: str = 'value',
        epochs: int = 50
    ) -> Dict[str, Any]:
        """
        Train agent's model

        Args:
            data: Training data
            target_col: Target column
            epochs: Number of epochs

        Returns:
            Training results
        """
        logger.info(f"Agent {self.agent_id} training...")

        # Simulate training
        losses = np.exp(-np.arange(epochs) / 10) + np.random.randn(epochs) * 0.1
        final_loss = float(losses[-1])

        self.training_history.append({
            'epochs': epochs,
            'final_loss': final_loss,
            'trained_at': datetime.now().isoformat()
        })

        self.state.status = 'trained'
        self.state.performance = 1.0 - final_loss
        self.state.last_update = datetime.now().isoformat()

        return {
            'agent_id': self.agent_id,
            'model_type': self.model_type,
            'epochs': epochs,
            'final_loss': final_loss,
            'performance': self.state.performance
        }

    def predict(
        self,
        data: pd.DataFrame,
        horizon: int = 30,
        target_col: str = 'value'
    ) -> Dict[str, Any]:
        """
        Generate forecast

        Args:
            data: Input data
            horizon: Forecast horizon
            target_col: Target column

        Returns:
            Forecast results
        """
        if self.state.status == 'idle':
            raise ValueError("Agent must be trained before prediction")

        # Simulate prediction
        last_value = data[target_col].values[-1]
        forecast = [
            last_value * (1 + np.random.randn() * 0.02)
            for _ in range(horizon)
        ]

        # Calculate confidence intervals
        std = np.std(forecast) * 0.5
        lower = [f - 1.96 * std for f in forecast]
        upper = [f + 1.96 * std for f in forecast]

        result = {
            'agent_id': self.agent_id,
            'model_type': self.model_type,
            'specialization': self.specialization,
            'forecast': forecast,
            'lower_bound': lower,
            'upper_bound': upper,
            'horizon': horizon,
            'generated_at': datetime.now().isoformat()
        }

        # Report to coordinator
        if self.communication:
            self.communication.send_message(
                sender=self.agent_id,
                receiver='coordinator',
                message_type='forecast_complete',
                content=result
            )

        return result

    def collaborate(
        self,
        other_agents: List['ForecastingAgent'],
        data: pd.DataFrame,
        horizon: int = 30
    ) -> Dict[str, Any]:
        """
        Collaborate with other agents

        Args:
            other_agents: List of other agents
            data: Input data
            horizon: Forecast horizon

        Returns:
            Collaborative forecast
        """
        # Get forecasts from all agents
        forecasts = []
        for agent in other_agents:
            try:
                forecast = agent.predict(data, horizon)
                forecasts.append(forecast)
            except ValueError:
                continue

        # Combine forecasts (simple average)
        if forecasts:
            combined_forecast = np.mean([f['forecast'] for f in forecasts], axis=0)

            return {
                'agent_id': self.agent_id,
                'collaboration_type': 'ensemble',
                'num_agents': len(forecasts),
                'forecast': combined_forecast.tolist(),
                'agent_forecasts': forecasts
            }

        return self.predict(data, horizon)

    def update_state(self, performance: float):
        """Update agent state"""
        self.state.performance = performance
        self.state.last_update = datetime.now().isoformat()

    def get_state(self) -> AgentState:
        """Get agent state"""
        return self.state


class CoordinatorAgent:
    """
    Coordinator Agent

    Coordinates multiple forecasting agents
    """

    def __init__(
        self,
        coordinator_id: str = 'coordinator',
        aggregation_method: str = 'weighted_average'
    ):
        """
        Initialize Coordinator Agent

        Args:
            coordinator_id: Coordinator identifier
            aggregation_method: How to aggregate forecasts ('weighted_average', 'voting', 'stacking')
        """
        self.coordinator_id = coordinator_id
        self.aggregation_method = aggregation_method
        self.role = AgentRole.COORDINATOR

        self.agents = {}
        self.communication = AgentCommunication()
        self.communication.register_agent(coordinator_id, self.role)

        self.forecast_history = []

        logger.info(f"CoordinatorAgent {coordinator_id} initialized")

    def register_agent(self, agent: ForecastingAgent):
        """Register a forecasting agent"""
        self.agents[agent.agent_id] = agent
        agent.set_communication(self.communication)
        logger.info(f"Registered agent {agent.agent_id}")

    def orchestrate_forecast(
        self,
        data: pd.DataFrame,
        horizon: int = 30,
        target_col: str = 'value'
    ) -> Dict[str, Any]:
        """
        Orchestrate forecasting across all agents

        Args:
            data: Input data
            horizon: Forecast horizon
            target_col: Target column

        Returns:
            Aggregated forecast
        """
        logger.info(f"Orchestrating forecast across {len(self.agents)} agents")

        # Collect forecasts from all agents
        agent_forecasts = {}
        for agent_id, agent in self.agents.items():
            try:
                forecast = agent.predict(data, horizon, target_col)
                agent_forecasts[agent_id] = forecast
            except ValueError as e:
                logger.warning(f"Agent {agent_id} failed: {e}")

        # Aggregate forecasts
        if not agent_forecasts:
            raise ValueError("No agents produced valid forecasts")

        aggregated = self._aggregate_forecasts(agent_forecasts)

        # Store in history
        self.forecast_history.append({
            'timestamp': datetime.now().isoformat(),
            'num_agents': len(agent_forecasts),
            'horizon': horizon,
            'forecasts': agent_forecasts,
            'aggregated': aggregated
        })

        return {
            'coordinator_id': self.coordinator_id,
            'aggregation_method': self.aggregation_method,
            'num_agents': len(agent_forecasts),
            'agent_forecasts': agent_forecasts,
            'aggregated_forecast': aggregated,
            'generated_at': datetime.now().isoformat()
        }

    def _aggregate_forecasts(
        self,
        forecasts: Dict[str, Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Aggregate forecasts from multiple agents"""
        forecast_arrays = [f['forecast'] for f in forecasts.values()]

        if self.aggregation_method == 'weighted_average':
            # Weight by agent performance
            weights = [
                self.agents[agent_id].state.performance
                for agent_id in forecasts.keys()
            ]
            total_weight = sum(weights)
            weights = [w / total_weight for w in weights]

            weighted_forecast = np.average(
                forecast_arrays,
                axis=0,
                weights=weights
            ).tolist()

        elif self.aggregation_method == 'voting':
            # Majority voting (discretized)
            discretized = [
                [round(v, 2) for v in f]
                for f in forecast_arrays
            ]
            forecast_series = pd.DataFrame(discretized)
            weighted_forecast = forecast_series.mode(axis=0).iloc[0].tolist()

        elif self.aggregation_method == 'stacking':
            # Stacking (simplified - use median)
            weighted_forecast = np.median(forecast_arrays, axis=0).tolist()

        else:
            # Simple average
            weighted_forecast = np.mean(forecast_arrays, axis=0).tolist()

        # Calculate confidence intervals
        forecast_array = np.array(forecast_arrays)
        std = np.std(forecast_array, axis=0).tolist()

        return {
            'forecast': weighted_forecast,
            'std': std,
            'lower_bound': (np.array(weighted_forecast) - 1.96 * np.array(std)).tolist(),
            'upper_bound': (np.array(weighted_forecast) + 1.96 * np.array(std)).tolist()
        }

    def optimize_agents(
        self,
        validation_data: pd.DataFrame,
        target_col: str = 'value'
    ) -> Dict[str, Any]:
        """
        Optimize agent configuration

        Args:
            validation_data: Validation data
            target_col: Target column

        Returns:
            Optimization results
        """
        logger.info("Optimizing agents...")

        results = {}
        for agent_id, agent in self.agents.items():
            # Evaluate agent performance
            try:
                forecast = agent.predict(validation_data, horizon=len(validation_data))
                actual = validation_data[target_col].values

                # Calculate error metrics
                errors = np.array(forecast['forecast'][:len(actual)]) - actual
                mae = np.mean(np.abs(errors))
                rmse = np.sqrt(np.mean(errors ** 2))

                performance = 1.0 / (1.0 + rmse)
                agent.update_state(performance)

                results[agent_id] = {
                    'mae': float(mae),
                    'rmse': float(rmse),
                    'performance': float(performance)
                }

            except Exception as e:
                logger.warning(f"Failed to optimize {agent_id}: {e}")
                results[agent_id] = {'error': str(e)}

        return {
            'coordinator_id': self.coordinator_id,
            'optimization_results': results,
            'optimized_at': datetime.now().isoformat()
        }

    def get_agent_states(self) -> List[AgentState]:
        """Get all agent states"""
        return [agent.get_state() for agent in self.agents.values()]

    def get_communication_stats(self) -> Dict[str, Any]:
        """Get communication statistics"""
        return self.communication.get_communication_stats()


class MultiAgentSystem:
    """
    Multi-Agent Forecasting System

    Complete system with multiple specialized agents
    """

    def __init__(
        self,
        num_agents: int = 5,
        agent_types: Optional[List[str]] = None,
        aggregation_method: str = 'weighted_average'
    ):
        """
        Initialize Multi-Agent System

        Args:
            num_agents: Number of agents
            agent_types: Types of agents (default: ['lstm', 'gru', 'transformer', 'arima', 'linear'])
            aggregation_method: Forecast aggregation method
        """
        self.num_agents = num_agents

        if agent_types is None:
            agent_types = ['lstm', 'gru', 'transformer', 'arima', 'linear']

        # Create coordinator
        self.coordinator = CoordinatorAgent(
            coordinator_id='main_coordinator',
            aggregation_method=aggregation_method
        )

        # Create agents
        self.agents = []
        specializations = ['short_term', 'medium_term', 'long_term', 'seasonal', 'trend']

        for i in range(num_agents):
            model_type = agent_types[i % len(agent_types)]
            spec = specializations[i % len(specializations)]

            agent = ForecastingAgent(
                agent_id=f'agent_{i}',
                model_type=model_type,
                specialization=spec
            )
            self.agents.append(agent)
            self.coordinator.register_agent(agent)

        self.is_trained = False

        logger.info(f"MultiAgentSystem initialized with {num_agents} agents")

    def train(
        self,
        train_data: pd.DataFrame,
        target_col: str = 'value',
        epochs: int = 50
    ) -> Dict[str, Any]:
        """
        Train all agents

        Args:
            train_data: Training data
            target_col: Target column
            epochs: Number of epochs

        Returns:
            Training results
        """
        logger.info(f"Training {len(self.agents)} agents...")

        results = {}
        for agent in self.agents:
            result = agent.train(train_data, target_col, epochs)
            results[agent.agent_id] = result

        self.is_trained = True

        return {
            'status': 'success',
            'num_agents': len(self.agents),
            'training_results': results,
            'trained_at': datetime.now().isoformat()
        }

    def predict(
        self,
        data: pd.DataFrame,
        horizon: int = 30,
        target_col: str = 'value'
    ) -> Dict[str, Any]:
        """
        Generate ensemble forecast

        Args:
            data: Input data
            horizon: Forecast horizon
            target_col: Target column

        Returns:
            Ensemble forecast
        """
        if not self.is_trained:
            raise ValueError("System must be trained before prediction")

        return self.coordinator.orchestrate_forecast(data, horizon, target_col)

    def optimize(
        self,
        validation_data: pd.DataFrame,
        target_col: str = 'value'
    ) -> Dict[str, Any]:
        """
        Optimize agent configurations

        Args:
            validation_data: Validation data
            target_col: Target column

        Returns:
            Optimization results
        """
        return self.coordinator.optimize_agents(validation_data, target_col)

    def get_system_status(self) -> Dict[str, Any]:
        """Get system status"""
        agent_states = self.coordinator.get_agent_states()
        comm_stats = self.coordinator.get_communication_stats()

        return {
            'num_agents': len(self.agents),
            'is_trained': self.is_trained,
            'agent_states': [
                {
                    'agent_id': state.agent_id,
                    'role': state.role.value,
                    'status': state.status,
                    'performance': state.performance
                }
                for state in agent_states
            ],
            'communication_stats': comm_stats,
            'aggregation_method': self.coordinator.aggregation_method
        }

    def get_forecast_history(self) -> List[Dict[str, Any]]:
        """Get forecast history"""
        return self.coordinator.forecast_history


def create_multi_agent_system(
    config: Optional[Dict[str, Any]] = None
) -> MultiAgentSystem:
    """
    Factory function to create multi-agent system

    Args:
        config: Configuration dictionary

    Returns:
        MultiAgentSystem instance
    """
    if config is None:
        config = {}

    return MultiAgentSystem(
        num_agents=config.get('num_agents', 5),
        agent_types=config.get('agent_types'),
        aggregation_method=config.get('aggregation_method', 'weighted_average')
    )
