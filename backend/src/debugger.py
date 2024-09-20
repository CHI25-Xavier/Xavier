import logging
from typeguard import typechecked

class CustomFormatter(logging.Formatter):
  grey = "\x1b[38;20m"
  yellow = "\x1b[33;20m"
  red = "\x1b[31;20m"
  bold_red = "\x1b[31;1m"
  reset = "\x1b[0m"
  # str_format = "%(asctime)s - %(name)s - %(levelname)s - %(message)s (%(filename)s:%(lineno)d)"
  str_format = "[%(filename)s:%(lineno)d] %(levelname)s: %(message)s "

  FORMATS = {
    logging.DEBUG: grey + str_format + reset,
    logging.INFO: grey + str_format + reset,
    logging.WARNING: yellow + str_format + reset,
    logging.ERROR: red + str_format + reset,
    logging.CRITICAL: bold_red + str_format + reset
  }

  @typechecked
  def format(self, record):
    log_fmt = self.FORMATS.get(record.levelno)
    formatter = logging.Formatter(log_fmt)
    return formatter.format(record)
  
@typechecked
def initLogger():
  # create logger with 'spam_application'
  logger = logging.getLogger("Xavier_Prompt")
  logger.setLevel(logging.DEBUG)

  # create console handler with a higher log level
  ch = logging.StreamHandler()
  ch.setLevel(logging.DEBUG)
  ch.setFormatter(CustomFormatter())
  logger.addHandler(ch)
  return logger

debugger = initLogger()