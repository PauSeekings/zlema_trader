import numpy as np
from datetime import datetime
from typing import Dict, Any, Union
from abc import ABC, abstractmethod

class BaseService(ABC):
    """Base service class with common functionality"""
    
    def __init__(self, exchange=None):
        self.exchange = exchange
    
    @staticmethod
    def convert_numpy_to_json(obj: Any) -> Any:
        """Convert numpy objects to JSON-serializable types"""
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        elif isinstance(obj, dict):
            return {k: BaseService.convert_numpy_to_json(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [BaseService.convert_numpy_to_json(item) for item in obj]
        elif isinstance(obj, (np.integer, np.int64)):
            return int(obj)
        elif isinstance(obj, (np.floating, np.float64)):
            return float(obj)
        elif isinstance(obj, np.bool_):
            return bool(obj)
        return obj
    
    @staticmethod
    def create_response(data: Dict[str, Any], **metadata) -> Dict[str, Any]:
        """Create standardized response with metadata"""
        response = BaseService.convert_numpy_to_json(data)
        response.update({
            "timestamp": datetime.now().isoformat(),
            **metadata
        })
        return response
    
    def handle_service_error(self, error: Exception, operation: str) -> Dict[str, Any]:
        """Standardized error handling"""
        error_msg = f"Error in {operation}: {str(error)}"
        return {
            "error": True,
            "message": error_msg,
            "timestamp": datetime.now().isoformat()
        }
    
    @abstractmethod
    def get_service_name(self) -> str:
        """Return the service name for logging/debugging"""
        pass
