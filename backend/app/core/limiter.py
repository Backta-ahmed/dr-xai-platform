from slowapi import Limiter
from slowapi.util import get_remote_address

# Lives in its own module so main.py and the route modules can both import it
# without a circular import.
limiter = Limiter(key_func=get_remote_address)

# Applied to the login endpoint. Generous enough that a doctor mistyping a
# password a few times is unaffected, tight enough that scripted guessing
# against the seeded-account problem is not viable.
LOGIN_RATE_LIMIT = "5/minute"
