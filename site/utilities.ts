interface IHtmlParts {
    [partName: string]: Element;
}

export interface IImmutableHtmlParts extends IHtmlParts {
    readonly [partName: string]: Element
}

function removeFromArray<T>(source: T[], itemToRemove: T) {
    let itemIndex = source.indexOf(itemToRemove);
    if (itemIndex < 0) {
        return;
    }

    source.splice(itemIndex, 1);
}

export function cloneIntoWithParts(template: HTMLTemplateElement, target: Element, partNames: string[]): IImmutableHtmlParts {
    let parts: IHtmlParts = {};
    let content = template.content;

    for (var index = 0; index < content.children.length; index += 1) {
        // Clone the node, and append it directly to the supplied container
        const templateChild = content.children[index];
        const clonedChild = <HTMLElement>templateChild.cloneNode(true);
        target.appendChild(clonedChild);

        // If we were asked to match parts, we'll do so.
        if (partNames?.length) {
            locatePartsFromDOM(clonedChild, partNames, parts);
        }
    }

    return parts;
}

function locatePartsFromDOM(element: Element, partNames: string[], parts: IHtmlParts): void {
    // No elements or part names, give up.
    if (!partNames?.length || !element || !parts) {
        return;
    }

    let locatedPartNames: string[] = []; // Track which ones we've located, so
    // we can remove them after. We only
    // support finding the first part with
    // a specific name.
    partNames.forEach((item) => {
        const selector = `[data-part='${item}']`;
        let foundPart = element.querySelector(selector);

        // querySelector only finds *decendents*, so if we didn't find
        // the item, maybe the element itself is the part.
        if (!foundPart && element.matches(selector)) {
            // Note; matches only gives you 'does selector match'
            // and doesn't return the element.
            foundPart = element;
        }

        if (!foundPart) {
            return;
        }

        // Since we found a part, we'll want to remove it later, but
        // since we're enumerating the item, we can't remove it yet
        locatedPartNames.push(item);
        parts[item] = foundPart;
    });

    // Now we can remove the part names we'd found so we don't
    // search for them again.
    locatedPartNames.forEach((itemToRemove) => removeFromArray(partNames, itemToRemove));
}