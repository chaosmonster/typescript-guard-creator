import * as ts from 'typescript';

const fs = require('fs');

// read entry folder from args
export function getCLIArguments() {
    const argumentArray = [...(process as any).argv];
    // for now we except only one argument for the root folder that needs to be converted
    // as we are still developing we assume the first two items are from the script
    // we do not check for validity yet
    argumentArray.splice(0, 2);
    return {source: argumentArray[0]};
}

export function readFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf-8', (err: any, data: any) => {
            err ? reject(err) : resolve(data);
        });
    });
}

function writeFile(filePath: string, data: string): Promise<void> {
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, data, (err: any) => {
            err ? reject(err) : resolve();
        });
    });
}

export function isInterfaceDeclaration(node: any): node is ts.InterfaceDeclaration {
    return node.kind === ts.SyntaxKind.InterfaceDeclaration;
}

export function isImportDeclaration(node: any): node is ts.ImportDeclaration {
    return node.kind === ts.SyntaxKind.ImportDeclaration;
}

export function isPropertySignatureDeclaration(node: any): node is ts.PropertySignature {
    return node.kind === ts.SyntaxKind.PropertySignature;
}

export function isPrimitiveType(node: ts.PropertySignature): boolean {
    switch (node.type.kind) {
        case ts.SyntaxKind.NumberKeyword:
        case ts.SyntaxKind.StringKeyword:
            return true;
        default:
            return false;
    }
}

export function primitiveGuardFunctionName(node: ts.PropertySignature): string {
    switch (node.type.kind) {
        case ts.SyntaxKind.NumberKeyword:
            return 'isNumber';
        case ts.SyntaxKind.StringKeyword:
            return 'isString';
        default:
            return '';
    }
}

export function buildGuardImport(importType: string, interfaceFileName: string): string {
    const pathSegments = interfaceFileName.split('/');
    pathSegments[pathSegments.length - 1] = pathSegments[pathSegments.length - 1].replace('.interface', '');
    const path = pathSegments.join('/');

    return `import { is${importType} } from '${path}.guard';\n`;
}

export function generateGuard(sourceFile: ts.SourceFile): string {
    let guardFunction = '';
    let interfaceName = '';
    const usedPrimitives = new Set<ts.SyntaxKind>();
    const usedNonPrimitveGuards = new Set<string>();
    const importStatements = new Map<string, string>();

    sourceFile.statements.forEach((interfaceNode: ts.Node) => {
        if (isInterfaceDeclaration(interfaceNode)) {
            interfaceName = (interfaceNode.name.escapedText as string);
            guardFunction += `export function is${interfaceName}(value: any): value is ${interfaceName} {\n\treturn`;
            interfaceNode.members.forEach((propertyNode: ts.Node) => {
                if (isPropertySignatureDeclaration(propertyNode)) {
                    if (isPrimitiveType(propertyNode)) {
                        usedPrimitives.add(propertyNode.type.kind);
                        guardFunction += ` ${primitiveGuardFunctionName(propertyNode)}(value.${((propertyNode.name as any).escapedText as string)}) &&`;
                    } else {
                        usedNonPrimitveGuards.add((propertyNode.type as any).typeName.escapedText);
                        guardFunction += ` is${(propertyNode.type as any).typeName.escapedText}(value.${((propertyNode.name as any).escapedText as string)}) &&`;
                    }
                }
            });

            // if the interface extends another interface we include the guard for that as well
            if (interfaceNode.heritageClauses !== undefined) {
                interfaceNode.heritageClauses.forEach(heritageClause => {
                    heritageClause.types.forEach(type => {
                        usedNonPrimitveGuards.add((type.expression as any).escapedText);
                        guardFunction += ` is${(type.expression as any).escapedText}(value) &&`;
                    });
                });
            }

            guardFunction += ' true;\n}'; // always close with a true statement
            // add tests for all used primitives
            let primitiveGuards = '';
            Array.from(usedPrimitives).forEach((type: ts.SyntaxKind) => {
                switch (type) {
                    case ts.SyntaxKind.NumberKeyword:
                        primitiveGuards += 'export function isNumber(value: any): value is number {\n\treturn typeof value === "number";\n}\n';
                        break;
                    case ts.SyntaxKind.StringKeyword:
                        primitiveGuards += 'export function isString(value: any): value is string {\n\treturn typeof value === "string";\n}\n';
                        break;
                }
            });

            guardFunction = primitiveGuards + guardFunction;
        }
        if (isImportDeclaration(interfaceNode)) {
            (interfaceNode.importClause.namedBindings as ts.NamedImports).elements.forEach(importNode => {
                importStatements.set( importNode.name.text, (interfaceNode.moduleSpecifier as any).text);
            });
        }
    });
    // add import statements for nonPrimitveGuards
    Array.from(usedNonPrimitveGuards).forEach(nonPrimitiveType => {
       const path = importStatements.get(nonPrimitiveType);
       guardFunction = `${buildGuardImport(nonPrimitiveType, path)}\n${guardFunction}`;

    });
    const pathSegments = sourceFile.fileName.split('/');
    guardFunction = `import { ${interfaceName} } from './${pathSegments[pathSegments.length - 1].replace('.ts', '')}';\n${guardFunction}`;

    return guardFunction;
}

export async function analyzeFile(filePath) {
    const file = await readFile(filePath);
    const sourceFile = ts.createSourceFile(
        filePath,
        file,
        ts.ScriptTarget.ES2015
    );
    const functionContent = generateGuard(sourceFile);

    const pathSegments = filePath.split('/');
    const fileName = pathSegments[pathSegments.length - 1];
    pathSegments[pathSegments.length - 1] = fileName.replace('.interface.ts', '.ts').replace('.ts', '.guard.ts');
    const guardFileName = pathSegments.join('/');
    await writeFile(guardFileName, functionContent);
}

// top level await is not existing
export async function bootstrap() {
    const _arguments = getCLIArguments();
    await analyzeFile(_arguments.source);
}

bootstrap();
