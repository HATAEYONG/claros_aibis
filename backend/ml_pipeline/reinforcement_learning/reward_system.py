"""
Reward System for RL Forecasting

Calculate rewards for reinforcement learning agents
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class RewardCalculator:
    """
    Base Reward Calculator

    Calculates rewards for RL agents in forecasting tasks
    """

    def __init__(
        self,
        reward_type: str = 'accuracy',
        scale: str = 'linear',
        normalize: bool = True
    ):
        """
        Initialize Reward Calculator

        Args:
            reward_type: Type of reward ('accuracy', 'improvement', 'rank')
            scale: Scaling method ('linear', 'log', 'exponential')
            normalize: Whether to normalize rewards
        """
        self.reward_type = reward_type
        self.scale = scale
        self.normalize = normalize

        self.reward_history = []
        self.baseline_reward = None

    def calculate(
        self,
        prediction: float,
        actual: float,
        baseline_prediction: Optional[float] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> float:
        """
        Calculate reward for a prediction

        Args:
            prediction: Model prediction
            actual: Actual value
            baseline_prediction: Baseline prediction for comparison
            context: Additional context information

        Returns:
            Calculated reward
        """
        if self.reward_type == 'accuracy':
            reward = self._accuracy_reward(prediction, actual, context)
        elif self.reward_type == 'improvement':
            reward = self._improvement_reward(
                prediction, actual, baseline_prediction, context
            )
        elif self.reward_type == 'rank':
            reward = self._rank_reward(prediction, actual, context)
        else:
            reward = self._accuracy_reward(prediction, actual, context)

        # Apply scaling
        reward = self._scale_reward(reward)

        # Normalize if needed
        if self.normalize and self.baseline_reward is not None:
            reward = reward / (abs(self.baseline_reward) + 1e-10)

        # Update history
        self.reward_history.append(reward)

        # Set baseline if not set
        if self.baseline_reward is None:
            self.baseline_reward = reward

        return float(reward)

    def _accuracy_reward(
        self,
        prediction: float,
        actual: float,
        context: Optional[Dict[str, Any]]
    ) -> float:
        """Calculate accuracy-based reward"""
        error = abs(prediction - actual) / (abs(actual) + 1e-10)

        # Negative error (lower error = higher reward)
        reward = -error

        return reward

    def _improvement_reward(
        self,
        prediction: float,
        actual: float,
        baseline_prediction: Optional[float],
        context: Optional[Dict[str, Any]]
    ) -> float:
        """Calculate improvement-based reward"""
        if baseline_prediction is None:
            return self._accuracy_reward(prediction, actual, context)

        prediction_error = abs(prediction - actual) / (abs(actual) + 1e-10)
        baseline_error = abs(baseline_prediction - actual) / (abs(actual) + 1e-10)

        # Reward improvement over baseline
        reward = baseline_error - prediction_error

        return reward

    def _rank_reward(
        self,
        prediction: float,
        actual: float,
        context: Optional[Dict[str, Any]]
    ) -> float:
        """Calculate rank-based reward"""
        predictions = context.get('all_predictions', [prediction])
        actuals = context.get('all_actuals', [actual])

        if len(predictions) <= 1:
            return self._accuracy_reward(prediction, actual, context)

        # Calculate errors for all predictions
        errors = [abs(p - a) for p, a in zip(predictions, actuals)]
        current_error = abs(prediction - actual)

        # Rank: lower error = better rank
        rank = sum(1 for e in errors if e < current_error) + 1

        # Reward based on rank (better rank = higher reward)
        reward = (len(predictions) - rank + 1) / len(predictions)

        return reward

    def _scale_reward(self, reward: float) -> float:
        """Apply scaling to reward"""
        if self.scale == 'linear':
            return reward
        elif self.scale == 'log':
            return np.sign(reward) * np.log1p(abs(reward))
        elif self.scale == 'exponential':
            return np.sign(reward) * np.exp(abs(reward) / 10) - 1
        else:
            return reward

    def get_reward_stats(self) -> Dict[str, float]:
        """Get reward statistics"""
        if not self.reward_history:
            return {}

        return {
            'mean': float(np.mean(self.reward_history)),
            'std': float(np.std(self.reward_history)),
            'min': float(np.min(self.reward_history)),
            'max': float(np.max(self.reward_history)),
            'latest': float(self.reward_history[-1])
        }


class ForecastingReward(RewardCalculator):
    """
    Specialized Reward Calculator for Forecasting

    Considers forecast-specific factors:
    - Accuracy
    - Timeliness
    - Uncertainty
    - Business impact
    """

    def __init__(
        self,
        accuracy_weight: float = 0.5,
        timeliness_weight: float = 0.2,
        uncertainty_weight: float = 0.15,
        business_weight: float = 0.15,
        horizon_decay: float = 0.95
    ):
        """
        Initialize Forecasting Reward

        Args:
            accuracy_weight: Weight for accuracy component
            timeliness_weight: Weight for timeliness component
            uncertainty_weight: Weight for uncertainty component
            business_weight: Weight for business impact component
            horizon_decay: Decay factor for forecast horizon
        """
        super().__init__(reward_type='forecasting')

        self.accuracy_weight = accuracy_weight
        self.timeliness_weight = timeliness_weight
        self.uncertainty_weight = uncertainty_weight
        self.business_weight = business_weight
        self.horizon_decay = horizon_decay

        self.component_history = {
            'accuracy': [],
            'timeliness': [],
            'uncertainty': [],
            'business': []
        }

    def calculate(
        self,
        prediction: float,
        actual: float,
        prediction_time: Optional[datetime] = None,
        actual_time: Optional[datetime] = None,
        uncertainty: Optional[float] = None,
        business_value: Optional[float] = None,
        horizon: int = 1
    ) -> float:
        """
        Calculate forecasting reward

        Args:
            prediction: Forecast value
            actual: Actual value
            prediction_time: When prediction was made
            actual_time: When actual value occurred
            uncertainty: Prediction uncertainty
            business_value: Business impact value
            horizon: Forecast horizon

        Returns:
            Calculated reward
        """
        # Calculate components
        accuracy_reward = self._calculate_accuracy(prediction, actual)
        timeliness_reward = self._calculate_timeliness(
            prediction_time, actual_time, horizon
        )
        uncertainty_reward = self._calculate_uncertainty(
            prediction, actual, uncertainty
        )
        business_reward = self._calculate_business_impact(
            prediction, actual, business_value
        )

        # Apply horizon decay
        horizon_factor = self.horizon_decay ** (horizon - 1)

        # Combine components
        reward = (
            self.accuracy_weight * accuracy_reward +
            self.timeliness_weight * timeliness_reward +
            self.uncertainty_weight * uncertainty_reward +
            self.business_weight * business_reward
        ) * horizon_factor

        # Update history
        self.component_history['accuracy'].append(accuracy_reward)
        self.component_history['timeliness'].append(timeliness_reward)
        self.component_history['uncertainty'].append(uncertainty_reward)
        self.component_history['business'].append(business_reward)

        # Limit history size
        max_history = 1000
        for key in self.component_history:
            if len(self.component_history[key]) > max_history:
                self.component_history[key] = self.component_history[key][-max_history:]

        self.reward_history.append(reward)

        return float(reward)

    def _calculate_accuracy(self, prediction: float, actual: float) -> float:
        """Calculate accuracy reward component"""
        mape = abs(prediction - actual) / (abs(actual) + 1e-10)

        # Transform to reward (0-1 range)
        accuracy_reward = max(0, 1 - mape)

        return accuracy_reward

    def _calculate_timeliness(
        self,
        prediction_time: Optional[datetime],
        actual_time: Optional[datetime],
        horizon: int
    ) -> float:
        """Calculate timeliness reward component"""
        if prediction_time is None or actual_time is None:
            return 1.0  # Default if no time info

        # Calculate how far in advance prediction was made
        time_diff = (actual_time - prediction_time).total_seconds() / 3600  # hours

        # Reward earlier predictions
        timeliness_reward = min(1.0, time_diff / (24 * horizon))

        return timeliness_reward

    def _calculate_uncertainty(
        self,
        prediction: float,
        actual: float,
        uncertainty: Optional[float]
    ) -> float:
        """Calculate uncertainty reward component"""
        if uncertainty is None:
            return 0.5  # Default if no uncertainty

        # Check if actual is within uncertainty bounds
        lower_bound = prediction - uncertainty
        upper_bound = prediction + uncertainty

        if lower_bound <= actual <= upper_bound:
            # Actual within bounds - reward based on tightness
            coverage = 1.0 - (uncertainty / (abs(prediction) + 1e-10))
            uncertainty_reward = max(0, min(1, coverage))
        else:
            # Actual outside bounds - penalty based on distance
            distance = min(
                abs(actual - lower_bound),
                abs(actual - upper_bound)
            ) / uncertainty
            uncertainty_reward = max(0, 1 - distance)

        return uncertainty_reward

    def _calculate_business_impact(
        self,
        prediction: float,
        actual: float,
        business_value: Optional[float]
    ) -> float:
        """Calculate business impact reward component"""
        if business_value is None:
            return 0.5  # Default if no business value

        # Calculate error impact
        error_impact = abs(prediction - actual) / (abs(actual) + 1e-10)

        # Business reward considers both accuracy and value
        business_reward = business_value * (1 - error_impact)

        return max(0, min(1, business_reward))

    def get_component_breakdown(self) -> Dict[str, Dict[str, float]]:
        """Get breakdown of reward components"""
        breakdown = {}

        for component, history in self.component_history.items():
            if history:
                breakdown[component] = {
                    'mean': float(np.mean(history)),
                    'std': float(np.std(history)),
                    'latest': float(history[-1])
                }

        return breakdown


class AccuracyReward(RewardCalculator):
    """
    Accuracy-focused Reward Calculator

    Emphasizes prediction accuracy
    """

    def __init__(
        self,
        error_metric: str = 'mape',
        reward_scale: float = 1.0,
        clip_range: Tuple[float, float] = (-1.0, 1.0)
    ):
        """
        Initialize Accuracy Reward

        Args:
            error_metric: Error metric ('mape', 'mae', 'rmse')
            reward_scale: Scaling factor for rewards
            clip_range: Range to clip rewards to
        """
        super().__init__(reward_type='accuracy')

        self.error_metric = error_metric
        self.reward_scale = reward_scale
        self.clip_range = clip_range

        self.error_history = []

    def calculate(
        self,
        prediction: float,
        actual: float,
        baseline: Optional[float] = None
    ) -> float:
        """
        Calculate accuracy-based reward

        Args:
            prediction: Model prediction
            actual: Actual value
            baseline: Baseline value for comparison

        Returns:
            Calculated reward
        """
        # Calculate error
        if self.error_metric == 'mape':
            error = abs(prediction - actual) / (abs(actual) + 1e-10)
        elif self.error_metric == 'mae':
            error = abs(prediction - actual)
        elif self.error_metric == 'rmse':
            error = (prediction - actual) ** 2
        else:
            error = abs(prediction - actual) / (abs(actual) + 1e-10)

        self.error_history.append(error)

        # Transform error to reward
        reward = -error * self.reward_scale

        # Clip reward
        reward = np.clip(reward, self.clip_range[0], self.clip_range[1])

        # Update history
        self.reward_history.append(reward)

        return float(reward)

    def get_accuracy_stats(self) -> Dict[str, float]:
        """Get accuracy statistics"""
        if not self.error_history:
            return {}

        return {
            'mean_error': float(np.mean(self.error_history)),
            'std_error': float(np.std(self.error_history)),
            'min_error': float(np.min(self.error_history)),
            'max_error': float(np.max(self.error_history)),
            'latest_error': float(self.error_history[-1])
        }


class BusinessReward(RewardCalculator):
    """
    Business-focused Reward Calculator

    Emphasizes business value and impact
    """

    def __init__(
        self,
        cost_matrix: Optional[Dict[str, float]] = None,
        profit_function: Optional[callable] = None
    ):
        """
        Initialize Business Reward

        Args:
            cost_matrix: Cost matrix for different error scenarios
            profit_function: Custom profit function
        """
        super().__init__(reward_type='business')

        self.cost_matrix = cost_matrix or {
            'underprediction': 1.0,
            'overprediction': 0.8,
            'correct': 0.0
        }

        self.profit_function = profit_function or self._default_profit_function

        self.business_history = []

    def calculate(
        self,
        prediction: float,
        actual: float,
        price: Optional[float] = None,
        cost: Optional[float] = None
    ) -> float:
        """
        Calculate business-based reward

        Args:
            prediction: Forecast value
            actual: Actual demand/value
            price: Selling price (for demand forecasting)
            cost: Production cost

        Returns:
            Calculated reward
        """
        # Calculate profit/loss
        profit = self.profit_function(prediction, actual, price, cost)

        # Calculate cost of error
        error_type = self._get_error_type(prediction, actual)
        error_cost = self.cost_matrix.get(error_type, 0.0)
        error_cost *= abs(prediction - actual)

        # Business reward = profit - error cost
        reward = profit - error_cost

        self.business_history.append({
            'profit': profit,
            'error_cost': error_cost,
            'reward': reward
        })

        self.reward_history.append(reward)

        return float(reward)

    def _default_profit_function(
        self,
        prediction: float,
        actual: float,
        price: Optional[float],
        cost: Optional[float]
    ) -> float:
        """Default profit calculation"""
        if price is None or cost is None:
            return 0.0

        # Profit from actual sales
        sales_profit = actual * (price - cost)

        # Cost of overproduction (waste)
        if prediction > actual:
            waste_cost = (prediction - actual) * cost
            sales_profit -= waste_cost

        # Opportunity cost of underproduction (lost sales)
        elif actual > prediction:
            lost_profit = (actual - prediction) * (price - cost)
            sales_profit -= lost_profit

        return sales_profit

    def _get_error_type(self, prediction: float, actual: float) -> str:
        """Determine error type"""
        tolerance = 0.05  # 5% tolerance

        if abs(prediction - actual) / (abs(actual) + 1e-10) <= tolerance:
            return 'correct'
        elif prediction < actual:
            return 'underprediction'
        else:
            return 'overprediction'

    def get_business_stats(self) -> Dict[str, Any]:
        """Get business statistics"""
        if not self.business_history:
            return {}

        profits = [h['profit'] for h in self.business_history]
        costs = [h['error_cost'] for h in self.business_history]
        rewards = [h['reward'] for h in self.business_history]

        return {
            'total_profit': float(np.sum(profits)),
            'total_cost': float(np.sum(costs)),
            'total_reward': float(np.sum(rewards)),
            'avg_profit': float(np.mean(profits)),
            'avg_cost': float(np.mean(costs)),
            'profit_margin': float(np.mean(profits) / (np.mean(costs) + 1e-10))
        }


class MultiObjectiveReward(RewardCalculator):
    """
    Multi-Objective Reward Calculator

    Combines multiple reward components with customizable weights
    """

    def __init__(
        self,
        reward_calculators: List[Tuple[str, RewardCalculator, float]]
    ):
        """
        Initialize Multi-Objective Reward

        Args:
            reward_calculators: List of (name, calculator, weight) tuples
        """
        super().__init__(reward_type='multi_objective')

        self.calculators = {
            name: {'calculator': calc, 'weight': weight}
            for name, calc, weight in reward_calculators
        }

        self.component_history = {name: [] for name, _, _ in reward_calculators}

    def calculate(
        self,
        prediction: float,
        actual: float,
        **kwargs
    ) -> float:
        """
        Calculate multi-objective reward

        Args:
            prediction: Model prediction
            actual: Actual value
            **kwargs: Additional arguments for components

        Returns:
            Combined reward
        """
        total_reward = 0.0
        components = {}

        for name, config in self.calculators.items():
            calculator = config['calculator']
            weight = config['weight']

            # Calculate component reward
            component_reward = calculator.calculate(prediction, actual, **kwargs)
            components[name] = component_reward

            # Add weighted component
            total_reward += weight * component_reward

            # Update history
            self.component_history[name].append(component_reward)

        self.reward_history.append(total_reward)

        return float(total_reward)

    def get_component_contributions(self) -> Dict[str, Dict[str, float]]:
        """Get contribution of each component"""
        contributions = {}

        for name, history in self.component_history.items():
            if history:
                weight = self.calculators[name]['weight']
                contributions[name] = {
                    'weight': weight,
                    'mean': float(np.mean(history)),
                    'std': float(np.std(history)),
                    'contribution': float(weight * np.mean(history))
                }

        return contributions


# Utility functions
def create_reward_calculator(
    reward_type: str = 'accuracy',
    **kwargs
) -> RewardCalculator:
    """Factory function for reward calculators"""
    if reward_type == 'forecasting':
        return ForecastingReward(**kwargs)
    elif reward_type == 'accuracy':
        return AccuracyReward(**kwargs)
    elif reward_type == 'business':
        return BusinessReward(**kwargs)
    else:
        return RewardCalculator(reward_type=reward_type, **kwargs)


def create_multi_objective_reward(
    objectives: List[str],
    weights: Optional[List[float]] = None
) -> MultiObjectiveReward:
    """Create multi-objective reward calculator"""
    if weights is None:
        weights = [1.0 / len(objectives)] * len(objectives)

    calculators = []
    for obj, weight in zip(objectives, weights):
        calc = create_reward_calculator(obj)
        calculators.append((obj, calc, weight))

    return MultiObjectiveReward(calculators)
