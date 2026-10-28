export function validate(schema){return (req,res,next)=>{const result=schema.safeParse(req.body);if(!result.success)return res.status(400).json({error:result.error.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; ')});req.body=result.data;next();};}
export function asyncRoute(fn){return (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);}
