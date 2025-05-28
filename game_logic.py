import random

def roll_dice():
    """Rolls two dice and returns the results as a tuple."""
    return (random.randint(1, 6), random.randint(1, 6))

def powerset(iterable):
    """
    powerset([1,2,3]) --> () (1,) (2,) (3,) (1,2) (1,3) (2,3) (1,2,3)
    """
    s = list(iterable)
    from itertools import chain, combinations
    return list(chain.from_iterable(combinations(s, r) for r in range(len(s)+1)))

def get_possible_moves(tiles, target_sum):
    """
    Finds all unique combinations of tiles that sum up to the target_sum.
    """
    possible_combinations = []
    for combo in powerset(tiles):
        if sum(combo) == target_sum:
            possible_combinations.append(list(combo))
    return possible_combinations
