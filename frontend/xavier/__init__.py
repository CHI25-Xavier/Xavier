try:
    from ._version import __version__
except ImportError:
    # Fallback when using the package in dev mode without installing
    # in editable mode with pip. It is highly recommended to install
    # the package from a stable release or in editable mode: https://pip.pypa.io/en/stable/topics/local-project-installs/#editable-installs
    import warnings
    warnings.warn("Importing 'xavier' outside a proper installation.")
    __version__ = "dev"

from .DFInfoLib import *
from .CompletionLib import *

def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "@xavier/xavier"
    }]

def _jupyter_server_extension_points():
    """Return metadata for the server extension."""
    return [{
        "module": "xavier.server_extension",
        "app": "xavier"
    }]
