import logging
import sys

class ChromaTelemetryFilter(logging.Filter):
    def filter(self, record):
        return "telemetry" not in record.getMessage().lower()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger("insight-agent")

for handler in logging.root.handlers:
    handler.addFilter(ChromaTelemetryFilter())