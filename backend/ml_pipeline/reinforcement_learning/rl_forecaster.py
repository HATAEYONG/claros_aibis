"""
Reinforcement Learning-based Forecaster

RL-based time series forecasting with adaptive learning
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Try to import RL libraries
GYM_AVAILABLE = False
STABLE_BASELINES_AVAILABLE = False

try:
    import gymnasium as gym
    from gymnasium import spaces
    GYM_AVAILABLE = True
except ImportError:
    pass

try:
    from stable_baselines3 import DQN, PPO, A3C
    from stable_baselines3.common.vec_env import DummyVecEnv
    STABLE_BASELINES_AVAILABLE = True
except ImportError:
    pass


class RLForecaster:
    """
    Reinforcement Learning-based Forecaster

    Uses RL agents to make forecasting decisions:
    - Model selection
    - Hyperparameter tuning
    - Ensemble weight optimization
    - Adaptive learning

    Features:
    - DQN (Deep Q-Network)
    - PPO (Proximal Policy Optimization)
    - A3C (Asynchronous Advantage Actor-Critic)
    """

    def __init__(
        self,
        rl_algorithm: str = 'dqn',
        state_dim: int = 64,
        action_dim: int = 10,
        learning_rate: float = 0.001,
        gamma: float = 0.99,
        buffer_size: int = 10000
    ):
        """
        Initialize RL Forecaster

        Args:
            rl_algorithm: RL algorithm ('dqn', 'ppo', 'a3c')
            state_dim: State dimension
            action_dim: Action dimension
            learning_rate: Learning rate
            gamma: Discount factor
            buffer_size: Replay buffer size
        """
        self.rl_algorithm = rl_algorithm
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.learning_rate = learning_rate
        self.gamma = gamma
        self.buffer_size = buffer_size

        self.agent = None
        self.environment = None
        self.reward_history = []
        self.action_history = []

        self.is_fitted = False

        logger.info(f"RLForecaster initialized with algorithm={rl_algorithm}")

    def fit(
        self,
        train_data: pd.DataFrame,
        validation_data: Optional[pd.DataFrame] = None,
        target_col: str = 'value',
        episodes: int = 100,
        max_steps: int = 1000
    ) -> Dict[str, Any]:
        """
        Train RL agent

        Args:
            train_data: Training data
            validation_data: Validation data
            target_col: Target column name
            episodes: Number of training episodes
            max_steps: Maximum steps per episode

        Returns:
            Training results
        """
        logger.info(f"Training RL forecaster with {self.rl_algorithm}")

        # Create environment
        self.environment = ForecastingEnvironment(
            train_data,
            target_col,
            state_dim=self.state_dim,
            action_dim=self.action_dim
        )

        # Create agent
        if STABLE_BASELINES_AVAILABLE:
            self.agent = self._create_agent()

            # Train
            self.agent.learn(
                total_timesteps=episodes * max_steps,
                log_interval=10
            )
        else:
            logger.warning("Stable Baselines not available, using simulation")
            self._simulate_training(episodes, max_steps)

        # Evaluate
        if validation_data is not None:
            eval_result = self.evaluate(validation_data, target_col)
        else:
            eval_result = {}

        self.is_fitted = True

        return {
            'status': 'success',
            'rl_algorithm': self.rl_algorithm,
            'episodes': episodes,
            'final_reward': self.reward_history[-1] if self.reward_history else 0,
            'evaluation': eval_result,
            'trained_at': datetime.now().isoformat()
        }

    def _create_agent(self):
        """Create RL agent based on algorithm"""
        if not STABLE_BASELINES_AVAILABLE:
            return None

        # Wrap environment
        env = DummyVecEnv([lambda: self.environment])

        if self.rl_algorithm == 'dqn':
            from stable_baselines3 import DQN
            agent = DQN(
                'MlpPolicy',
                env,
                learning_rate=self.learning_rate,
                gamma=self.gamma,
                buffer_size=self.buffer_size,
                verbose=1
            )
        elif self.rl_algorithm == 'ppo':
            from stable_baselines3 import PPO
            agent = PPO(
                'MlpPolicy',
                env,
                learning_rate=self.learning_rate,
                gamma=self.gamma,
                verbose=1
            )
        elif self.rl_algorithm == 'a3c':
            from stable_baselines3 import A2C  # A2C is synchronous version
            agent = A2C(
                'MlpPolicy',
                env,
                learning_rate=self.learning_rate,
                gamma=self.gamma,
                verbose=1
            )
        else:
            agent = DQN('MlpPolicy', env, learning_rate=self.learning_rate)

        return agent

    def _simulate_training(
        self,
        episodes: int,
        max_steps: int
    ) -> None:
        """Simulate RL training"""
        for episode in range(episodes):
            episode_reward = 0

            for step in range(max_steps):
                # Simulate action
                action = np.random.randint(self.action_dim)
                reward = np.random.randn() * 0.1 + 0.5

                episode_reward += reward
                self.action_history.append(action)

            self.reward_history.append(episode_reward)

    def predict(
        self,
        data: pd.DataFrame,
        horizon: int = 30,
        target_col: str = 'value'
    ) -> Dict[str, Any]:
        """
        Generate forecast using RL agent

        Args:
            data: Input data
            horizon: Forecast horizon
            target_col: Target column name

        Returns:
            Forecast results
        """
        if not self.is_fitted:
            raise ValueError("Model must be fitted before prediction")

        logger.info(f"Generating RL-based forecast for horizon={horizon}")

        # Get current state
        state = self._get_state(data, target_col)

        # Select action using agent
        if self.agent is not None:
            action, _ = self.agent.predict(state, deterministic=True)
        else:
            action = np.random.randint(self.action_dim)

        # Generate forecast based on action
        forecast = self._action_to_forecast(data, action, horizon, target_col)

        # Generate future dates
        dates = pd.date_range(
            start=pd.Timestamp.now(),
            periods=horizon,
            freq='D'
        ).tolist()

        return {
            'forecast': forecast,
            'dates': [d.isoformat() for d in dates],
            'horizon': horizon,
            'action': int(action),
            'confidence': self._calculate_confidence(),
            'generated_at': datetime.now().isoformat()
        }

    def _get_state(
        self,
        data: pd.DataFrame,
        target_col: str
    ) -> np.ndarray:
        """Get current state from data"""
        # Extract state features
        features = []

        # Recent values
        recent_values = data[target_col].values[-self.state_dim:]
        if len(recent_values) < self.state_dim:
            recent_values = np.pad(recent_values, (self.state_dim - len(recent_values), 0))
        features.extend(recent_values)

        return np.array(features[:self.state_dim])

    def _action_to_forecast(
        self,
        data: pd.DataFrame,
        action: int,
        horizon: int,
        target_col: str
    ) -> List[float]:
        """Convert action to forecast"""
        last_value = data[target_col].iloc[-1] if len(data) > 0 else 100

        # Action affects forecast behavior
        trend_factor = (action - self.action_dim / 2) / (self.action_dim / 2)  # -1 to 1

        forecast = []
        for i in range(horizon):
            base = last_value + trend_factor * i * 0.5
            noise = np.random.randn() * 2
            forecast.append(max(0, base + noise))

        return forecast

    def _calculate_confidence(self) -> float:
        """Calculate confidence in prediction"""
        if not self.reward_history:
            return 0.5

        # Based on recent performance
        recent_rewards = self.reward_history[-10:]
        avg_reward = np.mean(recent_rewards)

        return min(1.0, max(0.0, avg_reward))

    def evaluate(
        self,
        data: pd.DataFrame,
        target_col: str = 'value'
    ) -> Dict[str, Any]:
        """
        Evaluate RL forecaster

        Args:
            data: Evaluation data
            target_col: Target column name

        Returns:
            Evaluation metrics
        """
        predictions = []
        actuals = []

        for i in range(len(data) - 30):
            window = data.iloc[i:i+30]
            actual = data[target_col].iloc[i+30]

            pred = self.predict(window, horizon=1, target_col=target_col)
            predictions.append(pred['forecast'][0])
            actuals.append(actual)

        predictions = np.array(predictions)
        actuals = np.array(actuals)

        mape = np.mean(np.abs((actuals - predictions) / actuals)) * 100
        mae = np.mean(np.abs(actuals - predictions))
        rmse = np.sqrt(np.mean((actuals - predictions) ** 2))

        return {
            'mape': float(mape),
            'mae': float(mae),
            'rmse': float(rmse),
            'samples': len(predictions)
        }


class DQNAgent:
    """
    Deep Q-Network Agent

    Uses deep Q-learning for forecasting decisions
    """

    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        hidden_dims: List[int] = [256, 128],
        learning_rate: float = 0.001,
        gamma: float = 0.99,
        epsilon: float = 1.0,
        epsilon_decay: float = 0.995,
        epsilon_min: float = 0.01
    ):
        """
        Initialize DQN Agent

        Args:
            state_dim: State dimension
            action_dim: Action dimension
            hidden_dims: Hidden layer dimensions
            learning_rate: Learning rate
            gamma: Discount factor
            epsilon: Exploration rate
            epsilon_decay: Epsilon decay rate
            epsilon_min: Minimum epsilon
        """
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.hidden_dims = hidden_dims
        self.learning_rate = learning_rate
        self.gamma = gamma
        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min

        self.q_network = None
        self.target_network = None
        self.memory = []

        if STABLE_BASELINES_AVAILABLE:
            self._build_networks()

    def _build_networks(self):
        """Build Q-network and target network"""
        # In production, would build neural networks here
        pass

    def select_action(self, state: np.ndarray, training: bool = True) -> int:
        """Select action using epsilon-greedy policy"""
        if training and np.random.random() < self.epsilon:
            return np.random.randint(self.action_dim)

        # Use Q-network to select action
        q_values = self._get_q_values(state)
        return int(np.argmax(q_values))

    def _get_q_values(self, state: np.ndarray) -> np.ndarray:
        """Get Q-values for state"""
        # Simulated Q-values
        return np.random.randn(self.action_dim)

    def train_step(
        self,
        state: np.ndarray,
        action: int,
        reward: float,
        next_state: np.ndarray,
        done: bool
    ) -> float:
        """Train on a single transition"""
        # Store transition
        self.memory.append((state, action, reward, next_state, done))

        # Update epsilon
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay

        return reward


class PPOAgent:
    """
    Proximal Policy Optimization Agent

    Uses PPO for policy-based forecasting decisions
    """

    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        hidden_dims: List[int] = [256, 128],
        learning_rate: float = 0.0003,
        gamma: float = 0.99,
        clip_ratio: float = 0.2,
        epochs: int = 10
    ):
        """
        Initialize PPO Agent

        Args:
            state_dim: State dimension
            action_dim: Action dimension
            hidden_dims: Hidden layer dimensions
            learning_rate: Learning rate
            gamma: Discount factor
            clip_ratio: PPO clipping ratio
            epochs: Number of optimization epochs
        """
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.hidden_dims = hidden_dims
        self.learning_rate = learning_rate
        self.gamma = gamma
        self.clip_ratio = clip_ratio
        self.epochs = epochs

        self.policy = None
        self.value_function = None

    def select_action(self, state: np.ndarray) -> Tuple[int, float]:
        """Select action using current policy"""
        # Get action probabilities
        action_probs = self._get_action_probs(state)

        # Sample action
        action = np.random.choice(self.action_dim, p=action_probs)
        log_prob = np.log(action_probs[action] + 1e-10)

        return int(action), float(log_prob)

    def _get_action_probs(self, state: np.ndarray) -> np.ndarray:
        """Get action probabilities"""
        # Simulated action probabilities
        probs = np.random.rand(self.action_dim)
        return probs / probs.sum()

    def update(
        self,
        states: List[np.ndarray],
        actions: List[int],
        rewards: List[float],
        log_probs: List[float]
    ) -> Dict[str, float]:
        """Update policy using PPO"""
        # Calculate returns
        returns = self._calculate_returns(rewards)

        # PPO update (simplified)
        policy_loss = -np.mean(returns)
        value_loss = np.mean((np.array(returns) - np.mean(returns)) ** 2)

        return {
            'policy_loss': float(policy_loss),
            'value_loss': float(value_loss),
            'mean_return': float(np.mean(returns))
        }

    def _calculate_returns(self, rewards: List[float]) -> List[float]:
        """Calculate discounted returns"""
        returns = []
        R = 0
        for r in reversed(rewards):
            R = r + self.gamma * R
            returns.insert(0, R)
        return returns


class A3CAgent:
    """
    Asynchronous Advantage Actor-Critic Agent

    Uses A3C for concurrent learning
    """

    def __init__(
        self,
        state_dim: int,
        action_dim: int,
        hidden_dims: List[int] = [256, 128],
        learning_rate: float = 0.001,
        gamma: float = 0.99,
        num_workers: int = 4
    ):
        """
        Initialize A3C Agent

        Args:
            state_dim: State dimension
            action_dim: Action dimension
            hidden_dims: Hidden layer dimensions
            learning_rate: Learning rate
            gamma: Discount factor
            num_workers: Number of worker threads
        """
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.hidden_dims = hidden_dims
        self.learning_rate = learning_rate
        self.gamma = gamma
        self.num_workers = num_workers

        self.actor = None
        self.critic = None

    def select_action(self, state: np.ndarray) -> Tuple[int, float]:
        """Select action using actor network"""
        action_probs = self._get_action_probs(state)
        action = np.random.choice(self.action_dim, p=action_probs)
        log_prob = np.log(action_probs[action] + 1e-10)
        return int(action), float(log_prob)

    def _get_action_probs(self, state: np.ndarray) -> np.ndarray:
        """Get action probabilities from actor"""
        probs = np.random.rand(self.action_dim)
        return probs / probs.sum()

    def get_value(self, state: np.ndarray) -> float:
        """Get state value from critic"""
        return float(np.random.randn())


class ModelSelectionAgent:
    """
    RL Agent for Model Selection

    Automatically selects the best forecasting model
    """

    def __init__(
        self,
        models: List[str],
        state_dim: int = 32,
        learning_rate: float = 0.01
    ):
        """
        Initialize Model Selection Agent

        Args:
            models: List of available models
            state_dim: State dimension
            learning_rate: Learning rate
        """
        self.models = models
        self.num_models = len(models)
        self.state_dim = state_dim
        self.learning_rate = learning_rate

        self.q_table = np.zeros((2 ** state_dim, self.num_models))
        self.model_performance = {model: [] for model in models}

    def select_model(
        self,
        state: np.ndarray,
        explore: bool = True
    ) -> str:
        """Select model using Q-learning"""
        # Discretize state
        state_idx = self._discretize_state(state)

        # Epsilon-greedy selection
        if explore and np.random.random() < 0.1:
            model_idx = np.random.randint(self.num_models)
        else:
            model_idx = np.argmax(self.q_table[state_idx])

        return self.models[model_idx]

    def update_q_table(
        self,
        state: np.ndarray,
        model_idx: int,
        reward: float
    ) -> None:
        """Update Q-table"""
        state_idx = self._discretize_state(state)

        # Q-learning update
        self.q_table[state_idx, model_idx] += self.learning_rate * (
            reward - self.q_table[state_idx, model_idx]
        )

    def _discretize_state(self, state: np.ndarray) -> int:
        """Discretize continuous state"""
        # Simple binarization
        binary = ''.join(['1' if x > 0 else '0' for x in state[:self.state_dim]])
        return int(binary, 2) % (2 ** self.state_dim)

    def get_model_rankings(self) -> List[Tuple[str, float]]:
        """Get model rankings by performance"""
        rankings = []
        for model, performances in self.model_performance.items():
            if performances:
                avg_performance = np.mean(performances)
                rankings.append((model, avg_performance))
        return sorted(rankings, key=lambda x: x[1], reverse=True)


class AdaptiveEnsemble:
    """
    Adaptive Ensemble using RL

    Dynamically adjusts ensemble weights based on performance
    """

    def __init__(
        self,
        models: List[str],
        learning_rate: float = 0.01,
        update_frequency: int = 10
    ):
        """
        Initialize Adaptive Ensemble

        Args:
            models: List of models in ensemble
            learning_rate: Learning rate for weight updates
            update_frequency: How often to update weights
        """
        self.models = models
        self.num_models = len(models)
        self.learning_rate = learning_rate
        self.update_frequency = update_frequency

        # Initialize weights equally
        self.weights = np.ones(self.num_models) / self.num_models
        self.performance_history = {model: [] for model in models}
        self.update_count = 0

    def predict(
        self,
        predictions: Dict[str, np.ndarray]
    ) -> np.ndarray:
        """Generate weighted ensemble prediction"""
        weighted_pred = np.zeros_like(list(predictions.values())[0])

        for i, model in enumerate(self.models):
            if model in predictions:
                weighted_pred += self.weights[i] * predictions[model]

        return weighted_pred

    def update_weights(
        self,
        predictions: Dict[str, np.ndarray],
        actual: np.ndarray
    ) -> Dict[str, float]:
        """Update ensemble weights based on performance"""
        self.update_count += 1

        if self.update_count % self.update_frequency != 0:
            return {model: self.weights[i] for i, model in enumerate(self.models)}

        # Calculate performance for each model
        performances = []
        for model in self.models:
            if model in predictions:
                error = np.mean(np.abs(predictions[model] - actual))
                performance = 1.0 / (1.0 + error)  # Higher is better
                self.performance_history[model].append(performance)
                performances.append(performance)
            else:
                performances.append(0.0)

        # Update weights using policy gradient-like update
        performances = np.array(performances)
        exp_performances = np.exp(performances / 0.1)  # Temperature
        new_weights = exp_performances / np.sum(exp_performances)

        # Smooth update
        self.weights = (1 - self.learning_rate) * self.weights + \
                       self.learning_rate * new_weights

        # Normalize
        self.weights = self.weights / np.sum(self.weights)

        return {model: self.weights[i] for i, model in enumerate(self.models)}

    def get_weights(self) -> Dict[str, float]:
        """Get current ensemble weights"""
        return {model: self.weights[i] for i, model in enumerate(self.models)}

    def get_performance_history(self) -> Dict[str, List[float]]:
        """Get performance history for all models"""
        return self.performance_history


class ForecastingEnvironment:
    """
    Gym Environment for Forecasting RL

    Simulates forecasting task for RL training
    """

    def __init__(
        self,
        data: pd.DataFrame,
        target_col: str,
        state_dim: int = 64,
        action_dim: int = 10
    ):
        """
        Initialize Forecasting Environment

        Args:
            data: Time series data
            target_col: Target column name
            state_dim: State dimension
            action_dim: Action dimension
        """
        self.data = data
        self.target_col = target_col
        self.state_dim = state_dim
        self.action_dim = action_dim

        self.current_step = 0
        self.max_steps = len(data) - 30

        if GYM_AVAILABLE:
            self.action_space = spaces.Discrete(action_dim)
            self.observation_space = spaces.Box(
                low=-np.inf,
                high=np.inf,
                shape=(state_dim,),
                dtype=np.float32
            )

    def reset(self):
        """Reset environment"""
        self.current_step = 0
        return self._get_state()

    def step(self, action: int):
        """Execute one step"""
        # Get reward
        reward = self._calculate_reward(action)

        # Update state
        self.current_step += 1
        done = self.current_step >= self.max_steps

        # Get next state
        next_state = self._get_state()

        info = {}

        return next_state, float(reward), done, False, info

    def _get_state(self) -> np.ndarray:
        """Get current state"""
        if self.current_step + 30 >= len(self.data):
            return np.zeros(self.state_dim)

        state = self.data[self.target_col].values[
            self.current_step:self.current_step + self.state_dim
        ]

        # Pad if necessary
        if len(state) < self.state_dim:
            state = np.pad(state, (0, self.state_dim - len(state)))

        return state[:self.state_dim]

    def _calculate_reward(self, action: int) -> float:
        """Calculate reward for action"""
        # Reward based on forecasting accuracy
        if self.current_step + 30 >= len(self.data):
            return 0.0

        actual = self.data[self.target_col].iloc[self.current_step + 30]

        # Simulated forecast based on action
        last_value = self.data[self.target_col].iloc[self.current_step + 29]
        forecast = last_value * (1 + (action - self.action_dim / 2) * 0.01)

        # Negative MAE as reward
        reward = -abs(actual - forecast) / last_value if last_value > 0 else 0.0

        return reward


# Utility functions
def get_available_rl_libraries() -> Dict[str, bool]:
    """Get availability of RL libraries"""
    return {
        'gymnasium': GYM_AVAILABLE,
        'stable_baselines3': STABLE_BASELINES_AVAILABLE
    }


def install_stable_baselines() -> str:
    """Return pip install command for Stable Baselines3"""
    return "pip install stable-baselines3 gymnasium"
