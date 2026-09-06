// ============================================================================
// MOTION SPELL CHECKER — ExtendScript engine (CEP host)
// After Effects 2022+
//
// This file contains no UI. It is the ExtendScript "back end" that the CEP
// HTML panel (client/index.html + client/js/main.js) talks to through
// CSInterface.evalScript(). Every function the panel calls is prefixed
// "cs" and returns a JSON string.
// ============================================================================

var APP_NAME = "Motion Spell Checker";
var VERSION = "1.0.6";
var AUTHOR = "Amir Anderson";
var HIGHLIGHT_LAYER_NAME = "MSC Highlights";

// Captured immediately as this file is first loaded by CEP, since $.fileName
// only reliably reflects this script once execution enters here directly —
// on later evalScript() calls (Scan, Verify Dictionary, etc.) $.fileName can
// point at the anonymous eval buffer instead, breaking dictionary path lookup.
var HOST_SCRIPT_FILE_NAME = $.fileName;

// Set by the panel at startup via csSetExtensionRoot(), using CSInterface's
// getSystemPath("extension") on the JS side — the authoritative source for
// the extension's install folder, since it comes from CEP itself rather
// than ExtendScript's unreliable $.fileName introspection.
var EXTENSION_ROOT_PATH = null;
var EXTENSION_ROOT_DIAG = "(csSetExtensionRoot never called)";

// Takes a plain string, not JSON — called at panel startup, before this
// engine's JSON global is reliably available (confirmed: JSON.parse() here
// threw "JSON is undefined" on the very first evalScript call of a fresh
// session, even though JSON works fine in every other cs* function called
// later). A single string needs no parsing, so this sidesteps that entirely.
function csSetExtensionRoot(path) {
    try {
        EXTENSION_ROOT_DIAG = "received: '" + path + "'";
        if (path) {
            EXTENSION_ROOT_PATH = String(path);
            dictionaryData.dictionaryPath = null;
        }
        return "ok";
    } catch (e) { EXTENSION_ROOT_DIAG = "error: " + e.toString(); return "error"; }
}

// ==================== FALLBACK DICTIONARY ====================
// Built-in word list so the checker works even before any category files
// are dropped into /Dictionary/ (~8,100 general English + common tech/web/
// business/place-name words). Drop .txt word lists (one word per line, or
// "wrong -> right" correction lines) into a "Dictionary" folder next to
// this extension for full domain-specific coverage on top of this.
var FALLBACK_DICTIONARY = ("aa,aaa,aaron,ab,abilities,able,aboriginal,abortion,abroad,abs,absence,abstracts,acc,acceptable,accessed,accessing,accessories,accessory,accidents,accommodations,accompanied,accomplished,accordance,accordingly,accounts,accredited,accused,acer,achieved,achieving,acids,acres,acrobat,actions,activation,actively,activities,actors,acts,adam,adams,adapters,added,adding,additionally,additions,addressed,addresses,addressing,adds,adelaide,adidas,adjacent,adjustable,adjusted,administered,administrators,admissions,admitted,adopted,ads,adults,advances,advantages,adventures,advertisements,advertiser,advertisers,advised,ae,af,affairs,affected,affecting,affects,affiliate,affiliated,affiliates,affordable,ag,aged,agencies,agents,ages,aging,agreed,agreements,agrees,ah,aids,aimed,aims,airfare,airlines,airports,aj,ak,aka,al,albany,albums,alerts,alex,algorithms,alias,alice,allied,allocated,allowed,allowing,allows,alphabetical,alt,alternate,alternatives,alumni,am,amanda,amber,amd,amend,amended,amendments,amenities,america,americans,americas,amino,amongst,amounts,amp,ampland,amy,analog,analyses,analysts,analytical,anchors,andale,anderson,andrea,andrew,andy,angel,angeles,angels,animals,animate,animated,animatic,animatics,animator,animators,ann,anna,anne,annex,announced,announcements,announces,annually,answered,answers,anthony,anticipated,antiques,anymore,anytime,aol,apartments,apparel,appeared,appearing,appears,appendix,appliances,applicable,applicant,applicants,applications,applied,applies,applying,appointed,appraisal,appreciated,approved,approx,apps,apr,april,arabia,arcade,arch,architect,architectural,archived,archives,are,areas,arg,arguments,arising,arnold,arranged,arrangements,arrested,arrived,arthur,articles,artists,ascii,ashley,asian,asin,asked,asking,asks,aspects,ass,assessed,assessments,assigned,assignments,assisted,associated,associates,associations,assumed,assumes,assuming,assumptions,athletes,ati,atlantic,atlas,attached,attachment,attachments,attacks,attempted,attempts,attended,a" +
    "ttending,attitudes,attractions,attributes,auckland,auctions,aud,audi,aug,aus,authorities,authors,automated,automatically,autoplay,autos,av,ave,avg,awarded,awards,aye,az,b,ba,babe,babes,babies,bachelor,backed,backgrounds,bags,bailey,baker,balanced,bali,balls,bands,banks,baptist,barbara,bargains,barnes,barriers,barry,bars,bases,basics,baskets,bathrooms,batteries,battlefield,bb,bbw,bc,be,beaches,beads,beans,bears,beastiality,beatles,beaver,became,becomes,becoming,bedding,bedrooms,beds,been,began,begins,begun,behaviour,beliefs,believed,believes,ben,benjamin,benz,bernard,berry,bestsellers,beverly,bezier,bidder,bidding,bids,bigger,biggest,bikes,bikini,bills,billy,bingo,biol,biological,birds,bishop,bitrate,bits,biz,bizarre,bizrate,bk,blackjack,blocks,bloggers,blogging,blogs,blonde,blvd,bmw,boats,bob,bobby,bodies,bonds,bones,bonus,bookings,books,booth,booty,borders,bosnia,bottles,bought,boundaries,boxes,boys,bp,br,bra,brad,bradley,branches,brands,brass,breaks,breasts,breeding,breeds,bridal,bride,bridges,bringing,brings,brisbane,britain,britannica,britney,broadway,brochure,broke,broker,brokers,broll,brooklyn,brooks,brothers,brought,browse,browsers,browsing,bruce,brunette,brunswick,bryan,bs,bt,buddy,buf,bugs,builders,buildings,built,bulgarian,bumper,bumpers,buried,burning,burns,burton,businesses,busty,butt,butterfly,buttons,butts,buyers,buying,byte,bytes,c,ca,cab,cables,cached,cad,cal,calculated,calculations,calculator,calculators,calendars,calgary,called,calling,calls,cam,camcorder,camcorders,came,cameras,campaigns,campbell,camping,camps,cams,canadian,canal,candidates,candles,cant,capabilities,capitol,caps,captioning,captions,captured,cards,careers,carey,caribbean,caring,carl,carol,carried,carriers,carrying,cars,cartoons,cartridges,cashiers,casinos,catalogue,categories,catherine,cats,caused,causes,causing,cb,cc,cds,ce,cedar,celebrities,cells,celtic,centers,centres,cents,ceramic,certificates,cet,cf,cfr,cg,ch,chains,chairs,challenging,championships,chances,changed,changes,chan" +
    "ging,channels,chapters,char,characteristics,characters,charged,charges,charleston,charlie,charts,cheaper,cheapest,cheats,checking,cheers,chem,chemicals,chess,chevrolet,chi,chick,chicks,children,childrens,chips,choices,choosing,chose,christ,christians,christina,chroma,chronicles,chrysler,chuck,churches,chyron,chyrons,cia,ciao,circumstances,cisco,citations,cited,cities,citizens,citysearch,civic,cl,claimed,classes,classics,classified,classifieds,cleaner,cleaners,clicking,clients,clinics,clips,clocks,clouds,clubs,cm,cn,cnet,co,coaches,coaching,codecs,codes,coins,col,coldopen,coldopens,cole,colin,collaborative,colleagues,collectables,collected,collectibles,collecting,collections,colleges,collins,colored,colors,colorspace,colorspaces,colour,colours,columnists,columns,com,combined,comes,comics,coming,comm,commands,committed,committees,commonwealth,communications,communities,comp,companies,compaq,compared,comparing,comparisons,compatibility,competitions,competitors,compilation,compiled,completed,completing,compliant,comply,components,composed,composited,compositing,compounds,comps,computers,computing,con,concentrations,concepts,concerns,concerts,concluded,conclusions,conducted,conducting,conferences,config,configure,configured,confirmed,conflicts,conform,conforming,confused,connecting,connectivity,connector,connectors,cons,consequences,considerations,considered,considering,consisting,consists,consolidated,const,constitutes,constraints,constructed,consultants,consumers,contacts,contained,containers,containing,contains,contents,contests,continues,continuing,contracting,contractor,contractors,contracts,contributed,contributing,contributions,contributors,controlled,controlling,controls,converted,converter,cookbook,cookies,cooler,cooling,cooper,copied,copies,copying,copyrighted,copyrights,cord,cordless,corp,corporations,correspondents,cosmetic,cosmetics,costs,costumes,counters,counties,counting,countries,counts,couples,coupon,coupons,courses,covered,covering,covers,cox,cp,cr,cra" +
    "fts,craig,crap,created,creates,creating,creator,credits,creek,cricket,crimes,criteria,critics,crops,crossfades,cruises,cruz,cs,cst,ct,cu,cube,cuisine,cultures,cups,customers,customize,customized,cuts,cv,cvs,cyber,cycles,czech,d,dad,daddy,dailies,dakota,dale,dam,damaged,damn,daniel,danish,danny,das,databases,dated,dates,dave,davidson,days,db,dd,ddr,dealers,deals,dealtime,deaths,debian,dec,decades,decided,declared,decor,decorating,decorative,decreased,deemed,def,defects,defined,defines,defining,definitions,degrees,del,delayed,delays,deleted,delicious,deliverables,delivered,delivering,delivers,dell,deluxe,demands,democrats,demonstrated,den,denied,dennis,departments,depends,deposits,derived,des,described,describes,describing,descriptions,designed,designers,designing,designs,desired,desktops,destinations,destroyed,details,detected,determines,determining,deutsch,dev,devel,developed,developers,developing,developmental,developments,deviant,devices,di,diagnostic,dial,diameter,diamonds,diane,didn't,died,diego,dies,diff,differences,differential,difficulties,digest,dimensional,dimensions,dir,directed,directions,directories,directors,dis,disabilities,disable,disclaimer,disclaimers,discounted,discounts,discovered,discs,discussed,discusses,discussions,diseases,dishes,disney,disorders,dispatched,displayed,displaying,displays,dissolves,dist,distinguished,distributions,distributor,distributors,districts,disturbed,div,divided,divisions,diy,dj,dl,doc,dockable,doctors,documented,dod,dodge,doe,does,doesn't,dogs,doing,dollars,dolls,domains,dominican,don,don't,donations,donna,doors,doug,douglas,downloadable,downloaded,downloading,downloads,dp,dr,drawings,drawn,dreams,dresses,drew,drinking,drinks,driven,drivers,drives,dropped,drops,drugs,drums,ds,dsl,dt,duncan,durable,dutch,duties,dv,dvd,dvds,dx,e,ea,eagles,earl,earlier,earned,ears,easier,easter,eating,ebay,ebony,ebooks,ec,ecological,ed,eddie,edges,edited,editions,editors,edt,educators,edwards,ee,ef,effects,efforts,eg,eggs,el,elected,electi" +
    "ons,elements,ellen,ellis,elvis,em,emails,emerging,emily,eminem,emirates,emotions,employed,employees,employers,en,enabled,enables,enabling,encouraged,encouraging,encyclopedia,ended,endif,ends,eng,engaged,engineers,engines,english,enhanced,enjoyed,enlargement,enquiries,enrolled,ensuring,ent,entered,entering,enterprises,entities,entitled,entries,envelope,environments,epa,epinions,episodes,epson,eq,equations,equipped,er,eric,ericsson,errors,es,escort,escorts,essays,essentials,est,established,establishing,estimated,estimates,et,etc,eugene,eur,evaluated,evaluating,evans,eve,events,ex,examined,examples,exams,exceptions,exchanges,excluded,executed,executives,exercises,exhibitions,exists,exp,expanded,expanding,expansys,expectations,expected,expenditures,expenses,experiences,experiments,explained,explains,explorer,exploring,expo,exporting,exports,exposed,expressed,expressions,ext,extends,extensions,extras,eyed,eyes,f,fa,fabulous,faced,faces,facing,factors,facts,failed,fails,fallen,falling,falls,families,fans,faq,faqs,farmers,farms,faster,fastest,favorites,favourites,fax,fc,fda,fe,featured,features,featuring,feb,feeding,feeds,feelings,feels,feet,fell,felt,females,festivals,ff,fg,fi,fields,figures,filed,filename,filing,filled,filling,filmgrain,films,filtering,filters,finder,findings,finds,finest,fingering,fingers,finished,fired,firms,fisher,fisheries,fisting,fits,fixes,fixtures,fl,flags,flights,flip,floating,flooring,floors,florist,florists,flowers,flows,floyd,fm,foam,focused,focuses,focusing,folders,folding,folks,followed,follows,fonts,foods,footwear,forces,forecasts,forests,forgot,forgotten,formats,formed,forming,forms,fort,forums,foto,fotos,foundations,founded,fr,fragrance,framed,framerate,francis,franklin,fred,frederick,freebsd,fri,fruits,fs,ft,fujitsu,functionality,functions,funded,funds,furnished,furnishings,futures,fw,fwd,fx,fy,g,ga,gadgets,gained,gains,galleries,gambling,gamecube,games,gamespot,garden,gardening,gardens,gary,gates,gather,gathering,gave,gay,gb,gbp,gc,ge,g" +
    "eek,gen,genealogy,generate,generated,generating,generations,generic,genes,genesis,genres,geo,geographic,geographical,get,gets,getting,ghost,ghz,gi,gibson,gift,gifts,girl,girls,gis,given,gives,giving,glad,glance,glasses,glen,glenn,glory,glow,glyph,glyphs,gm,gmbh,gmt,gnome,gnu,goals,god,gods,going,gone,good,goods,gorgeous,gospel,got,goto,gotten,gourmet,governing,governmental,governments,gp,gr,grace,grades,gradients,graduates,graham,granted,grants,graphic,gras,grass,gratis,great,greater,greatest,greatly,greeting,greg,gregory,grew,grids,grill,grip,grocery,gross,grounds,groups,grove,grow,growing,grown,gs,gsm,gt,guess,guest,guestbook,guests,guided,guides,guild,guitars,gun,guns,guys,h,ha,had,hair,hairy,half,halloween,hamilton,hampshire,hand,handbook,handed,handheld,handled,handles,handoffs,hands,handy,hang,hanging,happen,happened,happens,happiness,happy,harbour,harder,harm,harrison,harry,hart,has,hate,hats,have,haven,having,hb,hd,hdtv,headed,headers,headlines,heads,healing,healthy,hear,heard,hearts,heather,heating,heaven,heavily,heights,held,hell,hello,help,helped,helpful,helping,helps,henry,herbal,herbs,here,hereby,herein,heritage,hero,heroes,hewlett,hey,hi,hidden,higher,highest,highlights,highly,highs,hiking,hills,hilton,hints,hire,hispanic,hist,historic,historical,hits,hiv,ho,hobbies,hobby,holdem,holder,holders,holdings,holds,hole,holes,holiday,holidays,holland,holmes,holy,homeland,homepage,homes,homework,hon,honda,honest,hong,honors,hop,hope,hopefully,hopes,hoping,horizon,hormone,horny,horse,horses,hospitals,host,hosted,hosts,hotels,hotmail,hottest,hourly,hours,household,households,houses,housewares,housing,hp,hr,href,hrs,hs,ht,hudson,huge,hughes,humanities,humanity,humans,hundred,hundreds,hungarian,hunter,hunting,hurt,husband,hwy,hz,ia,ian,ibm,ic,icons,icq,ict,id,idea,ideal,ideas,identical,identified,identifier,identify,identifying,identity,ie,ignore,ignored,ii,iii,ill,illegal,illness,illustrated,illustrations,im,images,imagination,imagine,imaging,img,immediate,immedi" +
    "ately,immune,impacts,implement,implemented,implementing,implications,implied,implies,imported,imports,imposed,impossible,impressive,improve,improved,improvements,improving,inappropriate,incentives,inches,include,included,includes,including,inclusive,incoming,incorporate,incorrect,increase,increased,increases,increasing,increasingly,incredible,independently,indexed,indian,indians,indicate,indicated,indicates,indicating,indicators,indirect,individual,individually,individuals,indoor,induced,industries,industry,infected,infections,info,inform,informational,informed,ingest,ingredients,initial,initially,initiated,initiatives,injured,injuries,ink,inkjet,inline,inn,inner,innocent,inns,input,inputs,inquiries,insert,inside,insight,inspiration,inspired,installed,installing,instances,instantly,institutional,institutions,instructional,instructions,instruments,int,integral,integrate,intel,intended,intention,inter,interact,interactions,interested,interesting,interests,interfaces,interim,interior,interlaced,internal,interracial,interviews,intro,introduce,introduced,introducing,invalid,invest,investigate,investigations,investing,investments,investors,invitation,invite,invited,involve,involved,involvement,involves,involving,ipaq,ipod,ir,iraqi,irish,is,islam,island,isle,isolated,israeli,issued,issues,ist,item,items,iterate,ix,j,ja,jack,jackets,jacob,james,jamie,jan,jane,janet,january,jason,jay,jc,jd,je,jean,jeep,jeff,jefferson,jeffrey,jelsoft,jennifer,jeremy,jerry,jessica,jesus,jewellery,jewish,jews,jimmy,jm,jo,joan,jobs,joe,joel,johnny,joined,joining,joke,jokes,jon,jones,josh,journalists,journals,journey,joy,jp,jpg,jr,judges,judy,juice,jul,julia,julie,july,jumpcut,jumpcuts,jun,june,jvc,k,karaoke,karen,kate,katie,katrina,kay,kb,kde,keeping,keeps,keith,kelkoo,kelly,ken,kennedy,kenneth,kept,kerning,kerry,kevin,keyboards,keyed,keyer,keyframe,keyframed,keyframes,keying,keys,keyword,kg,kick,kid,kids,kijiji,killed,killer,killing,kind,kinds,kinetic,kings,kissing,kitchen,kits,klein,km,knee,kn" +
    "ew,knight,knives,know,knowing,known,knows,kodak,kong,korea,ks,ky,l,la,lab,label,labels,laboratories,labour,labs,lack,ladies,lady,laid,lake,lakes,lamp,lamps,lands,lang,languages,lanka,laptops,large,largely,larger,largest,larry,las,laser,last,lat,late,later,latest,latex,latina,latinas,latino,latter,laugh,launched,launches,laundry,laura,lauren,lawn,lawrence,laws,lay,layer,layers,layouts,lb,lc,ld,le,leaders,leading,leads,leaf,learn,learned,leasing,least,leather,leave,leaves,leaving,lectures,legends,legs,leisure,lenders,lending,length,lenses,leonard,les,lesbian,lesbians,lesson,lessons,lets,letter,letterbox,letters,letting,levels,lexmark,lg,lib,liberty,libraries,licence,licensed,licenses,lie,lies,lifestyle,ligature,ligatures,lights,liked,likely,lil,limitations,limited,limits,limousines,linda,linear,lines,lingerie,linked,linking,links,lion,lip,lips,lisa,listed,listen,listening,listing,listings,lists,lite,literally,livecam,lived,liver,lives,livesex,ll,lloyd,ln,lo,loaded,loads,loans,loc,locale,locally,locate,located,locations,locked,lodge,lodging,logged,logos,logotype,logotypes,logs,lol,lonely,longer,look,looked,looking,looks,lookup,looping,lord,los,lose,losing,losses,lots,lottery,lotus,louis,louisville,loved,lovely,lover,lovers,loves,loving,lower,lowercase,lowerthird,lowerthirds,lowest,ls,lt,ltd,luck,lucky,luggage,luke,luminance,lunch,lung,luxury,lycos,lying,lynn,lyrics,m,machinery,machines,macintosh,macromedia,mad,made,madonna,mag,magazines,magic,mail,mailed,mailing,mainland,mainly,maintain,maintained,maintaining,make,maker,makers,makes,males,mall,manage,managed,managers,managing,mandatory,manhattan,manner,manor,manuals,manufacture,manufactured,manufacturer,manufacturers,manufacturing,maple,mapping,maps,mar,marc,margaret,margins,maria,marie,marked,market,markets,marks,marriage,married,marriott,marshall,mart,martha,mason,massage,massive,mastercard,masturbating,mat,matches,matching,mate,maternity,math,mathematical,matrix,matt,matters,mattes,matthew,mature,mazda,mb,mba,mc,mcd" +
    "onald,md,meals,meaning,meant,measured,measurement,measurements,measures,mechanism,mechanisms,med,medal,medicaid,medicare,medications,medieval,medline,meetings,meets,mega,melbourne,melissa,mem,memories,men,ment,mental,mentioned,menus,mercedes,merchant,merchants,mere,merely,messages,met,meta,metals,meters,methods,mexican,mf,mg,mhz,mi,mice,mid,midi,midlands,midnight,midwest,might,mighty,mike,mile,milfhunter,milfs,mill,miller,million,millions,mills,milton,min,mind,minerals,mini,minimal,ministers,ministry,minolta,minority,mins,minus,mirrors,misc,miscellaneous,miss,missing,missions,mistakes,mistress,mitchell,mitsubishi,mix,mm,mn,mobiles,mocap,mod,models,modes,modifications,modified,modify,modules,mom,moments,moms,mon,monday,monetary,monica,monitors,monkey,mono,monroe,monster,montage,montgomery,monthly,months,montreal,moore,moral,morning,morph,morphing,mortgages,mostly,motel,motels,mother,mothers,motiongraphics,motorcycle,motorola,motors,mountains,mounting,mouth,move,moved,movements,moves,movies,moving,mozilla,mph,mrs,ms,msg,msgid,msgstr,msn,mt,murder,murphy,murray,museums,musical,musicians,muslim,must,mw,mx,myers,n,na,nail,naked,nam,named,names,nano,nascar,nasdaq,nasty,nation,nationwide,native,naturally,naturals,nature,naval,navigate,nb,nc,ne,nearby,nearest,necessarily,neck,needed,needs,negative,negotiations,neighborhood,neighbors,neil,nelson,neo,nervous,netscape,networking,networks,newbie,newer,newest,newly,newport,newsletters,newspapers,newsrooms,newton,next,ng,nh,nhs,ni,nicholas,nick,nickname,nicole,nights,nike,nikon,nine,nintendo,nipple,nipples,nissan,nj,nl,nm,nn,no,noble,nodes,noise,nokia,nonprofit,noon,norman,north,northeast,northwest,norton,norwegian,not,notebook,notebooks,noted,noticed,notices,notifications,notified,notify,notion,nov,novels,november,now,np,nr,ns,nsw,nt,nu,nude,nuke,numbers,numerical,numerous,nursery,nurses,nutrition,nuts,nutten,nv,nw,ny,nyc,nz,o,oak,oasis,obituaries,objectives,objects,obligations,observations,observe,observed,obtain,obtained,obtai" +
    "ning,obvious,obviously,oc,occasion,occasions,occur,occurred,occurs,oclc,oct,october,odd,oe,oem,of,offered,offering,offerings,offers,office,officers,offices,officially,offline,oh,oils,ok,okay,old,older,oldest,oliver,olympic,olympus,om,omega,once,ones,ongoing,ons,oo,ooo,oops,op,opacity,opened,opener,openers,opens,operate,operated,operates,operational,operators,opinions,opposed,opposite,opposition,opt,optimal,option,ordered,ordering,orders,org,organisation,organisations,organizational,organizations,organize,organized,orgy,orientation,original,originally,os,oscar,ot,others,ou,ought,outcomes,outdoor,outdoors,outer,outreach,outside,oval,oven,overcome,overseas,overview,own,owned,owner,owners,oz,p,pa,pack,packages,packaging,packard,packed,packets,packs,pad,pads,pages,pain,paint,painted,paintings,pairs,pal,palace,palestinian,palm,panasonic,panels,panties,pantone,pantyhose,paperbacks,papers,para,parade,paradise,parameters,parent,parents,parish,parker,parks,partial,participants,participate,participating,participation,particle,particles,particular,parties,partners,partnerships,parts,passed,passengers,passes,passion,passport,past,pat,patches,patents,paths,patients,patio,patricia,patrick,patterns,pay,payable,payday,paying,payments,paypal,pays,pb,pc,pcs,pd,pda,pdas,pdt,pe,pearl,pee,peeing,peer,penalties,pending,penny,pension,pentium,people,peoples,percent,percentage,perception,perfect,perfectly,perform,performances,performed,performing,perfume,periodic,periodically,periods,peripherals,perl,permalink,permission,permissions,permits,permitted,perry,person,personality,personally,personals,personnel,persons,perspectives,perth,pet,pete,petersburg,pets,pg,ph,pharmaceuticals,pharmacies,phd,phil,philip,philips,phillips,phones,photograph,photographers,photographic,photographs,photos,phpbb,phys,physicians,pichunter,picked,picks,pickup,pics,picture,pictures,pieces,pierre,pig,pill,pillarbox,pills,pine,pins,pioneer,pipelines,piss,pissing,pit,pixels,pizza,pl,placed,places,placing,plains,planned," +
    "planner,plans,plants,plates,playback,playboy,played,players,playing,playlist,plays,playstation,plc,pleasant,please,pleased,pleasure,plenty,plugins,plus,pmid,poems,pointed,poker,pole,policies,polls,polo,poly,polyphonic,pond,poor,pope,popular,popularity,populations,por,portable,portal,porter,portion,portions,ports,pos,positions,positive,possibilities,possibility,possible,postage,postal,posted,poster,posters,posting,postposted,posts,pot,potentially,potter,pound,pounds,pour,poverty,powell,powered,powerful,pp,practitioners,praise,pray,prayer,pre,precious,precise,precomp,precomposition,precompositions,precomps,predicted,prefer,preference,pregnant,premises,prep,preparation,prepare,prepared,preparing,prescribed,presence,presentations,presented,presents,preservation,presidential,pretty,prev,prevent,preventing,previews,previous,previously,price,priced,prices,pride,priest,primarily,prime,prince,princess,printable,printed,printers,prints,priorities,prize,prizes,problems,proc,procedures,proceed,proceeding,proceedings,proceeds,processed,processes,processors,produce,produced,producers,produces,producing,productions,productive,products,profession,professionals,profiles,profits,programme,programmes,programs,projected,projector,projectors,projects,promised,promo,promos,promoting,promotional,promotions,prompt,prompter,proper,properly,properties,proposals,proposed,prores,pros,prospect,prospective,prospects,prostores,prot,protect,protecting,proteins,protest,protocols,proud,prove,proved,proven,provide,provided,providers,provides,providing,province,provincial,provision,provisions,proxies,ps,psp,pst,pt,pts,pty,pub,publications,publicly,published,publishers,pubmed,puerto,pulled,pupils,puppet,puppeting,purchase,purchased,purchases,purchasing,pure,purposes,pursuant,pursue,put,puts,putting,puzzle,puzzles,q,qty,qualifications,qualified,qualify,quantities,quantity,quarterly,quarters,que,queensland,quest,questions,quick,quickly,quotations,quoted,quotes,r,ra,races,rachel,racial,racing,rackfocus,ra" +
    "cks,radius,raise,raising,ralph,ran,ranch,randy,ranges,ranging,ranked,ranking,rankings,ranks,rapidly,rapids,rare,raster,rat,rated,rates,ratio,rats,raw,raymond,rc,rd,re,reached,reaching,reactions,read,reader,readers,readings,reads,ready,realistic,realize,realized,really,realty,rear,reason,reasonably,reasons,rebate,rebecca,rec,receive,received,receives,receiving,recent,recently,reception,receptor,recipe,recipes,recipient,recipients,recognize,recognized,recommend,recommendations,recommended,recommends,reconstruction,recorded,recordings,recover,redeem,reduced,reduces,reducing,ref,refer,references,referred,referring,refers,refinance,refine,reflect,reflected,reflects,reform,refund,refused,reg,regard,regarding,regardless,regards,regime,region,regions,registered,regularly,regulated,relate,related,relating,relation,relationship,relationships,relatively,relax,released,releases,reload,relocation,rely,remained,remaining,remains,remarks,remember,remembered,remix,removal,remove,removed,removing,renderer,renewal,rent,rentals,rep,repairs,repeated,replace,replaced,replica,replied,replies,reported,reporters,reports,represent,representatives,represented,representing,represents,reprints,reproduced,republican,republicans,reputation,requested,requests,require,requirements,requires,requiring,researchers,reseller,reservations,reserved,reserves,reset,residence,residential,residents,resistant,resolutions,resolve,resolved,resort,resorts,resources,respect,respective,respectively,respond,responded,respondents,responses,responsibilities,responsible,restaurants,restrictions,resulted,resulting,results,retailer,retailers,retain,retired,retrieved,returned,returning,returns,rev,revealed,revenues,reverse,reviewed,reviewer,reviews,revised,revisions,rf,rfc,rh,rhode,ri,ribbon,rica,rich,richard,rick,rico,rid,rider,riding,rigged,rim,ringtone,ringtones,rio,rip,ripe,rising,risks,rivers,rm,rn,roads,rob,roberts,robin,robinson,robust,rocks,rocky,rod,roger,rogers,roles,roller,rolling,rolls,roman,ron,ronald,rooms," +
    "root,roots,roses,ross,roster,rotoscope,rotoscoped,rotoscoping,roulette,routers,routes,rows,roy,royalty,rpg,rr,rrp,rs,rubber,rugby,rugs,run,rundown,rundowns,running,runs,russell,ruth,rv,rw,rx,ryan,s,sacred,sad,safely,said,salad,salvador,same,samples,sampling,samsung,samuel,san,sandra,sandy,sansserif,sara,sarah,satisfied,satisfy,saturday,sauce,saudi,saved,saver,saving,savings,saw,say,saying,says,sb,sc,scales,scanners,scanning,scenario,scenes,schedules,scheme,schemes,scholars,scholarships,schools,sci,scientists,scored,scores,scoring,scott,scottish,scratch,screens,screenshot,screenshots,scripts,scrub,scrubbing,scsi,sd,seafood,sealed,seamless,sean,searched,searches,searching,seasonal,seasons,seats,sec,seconds,secretary,secrets,sections,sector,sectors,secure,secured,see,seeds,seeing,seek,seeker,seeking,seeks,seem,seemed,seems,seen,sees,segment,segments,selected,selecting,selections,sell,seller,sellers,selling,sells,semi,seminars,send,sender,sending,sends,seniors,sensors,sent,sep,separate,separated,separately,sept,september,sequences,ser,serial,serious,seriously,served,servers,serves,serving,sessions,sets,settle,settled,seven,sex,sexy,sf,sg,sh,shadow,shakespeare,shall,shape,shaped,shapes,shareholders,sharpen,shaved,sheep,sheet,shelf,shelter,shemale,shield,shipped,ships,shirts,shoe,shopper,shoppers,shopzilla,shortly,shots,should,showed,showers,showing,shown,showopen,shows,showtimes,shut,shutter,si,sick,side,sides,siemens,sierra,sigma,signals,signed,significantly,signing,signs,signup,silence,sim,similar,similarly,simon,simply,simpson,sims,simulcast,simultaneously,sin,sing,singing,sir,sister,sisters,sit,sitemap,sites,sitting,situated,situations,six,size,sized,sizes,sk,ski,skilled,skin,skins,skip,sku,sky,sl,slates,slave,sleep,sleeping,sleeve,slideshow,slight,slim,slots,slowly,sm,smaller,smile,smooth,snake,snapshot,societies,socket,socks,sol,solaris,sold,soldiers,solely,solomon,solutions,solve,solving,somehow,somewhere,son,songs,sonic,sons,sony,soon,soonest,sorry,sorted,sots,so" +
    "ught,soundbite,soundbites,sounds,sources,southeast,southwest,soviet,sp,spaces,spanking,spare,spatial,speak,speakers,speaking,speaks,spears,spec,specialized,specials,specialty,specifications,specifics,specified,specify,specs,spectacular,spell,spencer,spend,spending,spent,spider,spirit,spirits,spiritual,spirituality,splices,spline,splines,spoke,spoken,sponsors,sporting,spots,spouse,spray,springfield,springs,sq,square,squirting,sr,src,ss,staffing,stages,stainless,stamp,stamps,stand,stands,stanley,starring,stars,starsmerchant,start,started,starter,starting,starts,stat,stated,statements,states,statewide,stations,statistical,stats,stay,stayed,staying,std,ste,steady,steam,stem,step,stephen,steps,stereo,sterling,steve,steven,stewart,stickers,stockings,stocks,stolen,stomach,stone,stones,stood,stopped,stops,stored,stores,strange,strap,strategic,strategies,streams,strengthen,strictly,strings,strip,strong,stronger,strongly,struck,struct,structures,struggle,stuart,stuck,students,studied,studios,studying,stuff,stunning,styles,stylish,su,sub,subjects,sublimedirectory,submissions,submit,submitted,submitting,subscriptions,subsection,subsequently,substance,substances,substantially,substitute,subtitles,succeed,successful,successfully,suck,sucking,sucks,suddenly,sue,suffer,suffered,suffering,sufficient,suggest,suggested,suggestion,suggestions,suggests,suicide,suitable,suites,suits,sullivan,sum,sunday,sunny,sunshine,superb,superior,supers,supplements,supplied,suppliers,supplies,supply,supported,supporters,supporting,supports,suppose,supposed,sur,sure,surf,surfaces,surgical,surplus,surprise,surprised,surrounding,surveys,survive,susan,suse,suspended,suzuki,sw,swap,swatch,swatches,swedish,sweet,swim,swingers,swiss,switches,sydney,symantec,symbols,symposium,symptoms,syndicated,synopsis,synthetic,sys,systems,t,ta,tables,tablets,tabs,tagged,take,taken,taking,tale,talent,tales,talk,talked,talking,talks,tall,tanks,tapes,targeted,targets,tasks,taught,taxation,taxes,taylor,tc,td,te,teach,teachers" +
    ",tears,tease,teasers,techniques,technological,technologies,ted,teen,teenage,teens,teeth,tel,telecom,telecommunications,telephone,tell,telling,tells,temp,temperatures,templates,ten,tend,terrace,terrible,territories,territory,terror,terrorists,tested,testimonials,tests,tex,texts,tft,tgp,th,thai,thank,thanks,thats,theaters,thee,thehun,themes,then,theorem,theoretical,theories,there,thereby,thereof,thesaurus,thick,thin,thing,think,thinking,thinks,thirty,thomas,thompson,thomson,thong,thongs,thou,thought,thoughts,thousand,thousands,threaded,threatened,three,threesome,throat,throws,thru,thu,thumb,thumbnails,thumbs,thumbzilla,thursday,thy,ticker,tickets,tied,tier,ties,tiger,tight,tile,till,tim,timelines,timothy,tin,tiny,tion,tip,tired,tires,tit,titans,titlecase,titles,tits,titten,tm,tn,tobacco,today,todd,toe,together,told,tom,tommy,tomorrow,ton,toner,tones,tongue,tonight,tons,tony,took,toolbox,tools,topics,topless,tops,toronto,toshiba,toss,totals,tough,tourist,tournaments,towers,town,towns,township,toxic,toy,toyota,toys,tp,tr,trackback,tracked,tracker,tracks,trade,trademarks,trades,trading,traditions,trailer,trailers,trails,trained,trains,tranny,trans,transaction,transactions,transcode,transcoding,transexual,transexuales,transferred,transfers,transit,transitions,translate,translated,transmitted,transparent,trash,traveler,travelers,travesti,treasure,treasury,treat,treated,treatments,trees,trek,trembl,trends,treo,tri,trials,triangle,tribe,trick,tricks,tried,tries,trinidad,trip,tripadvisor,trivia,troops,tropical,trouble,troy,trucks,true,truly,trunk,trusted,trying,ts,tt,tu,tub,tubes,tuesday,tune,turbo,turkish,turned,turning,turns,tutorials,tvs,twelve,twice,twiki,twinks,twins,twist,tx,tyler,typefaces,types,typographic,u,uc,uk,ultimate,ultimately,ultra,um,unable,unavailable,uncertainty,uncle,und,underlying,understand,understanding,understood,undertaken,underwear,une,unemployment,unfortunately,unified,unions,uniprotkb,units,univ,universities,unknown,unlikely,unlimited,unsigned,unti" +
    "tled,unto,upcoming,updated,updates,updating,upgrades,uploaded,upper,uppercase,ups,upskirt,upskirts,ur,urw,usa,usage,usd,used,useful,users,uses,using,usr,ut,utc,utilities,utils,uv,v,va,vacation,vacations,val,valentine,valid,valuable,vancouver,variables,variations,variety,various,vary,vast,vat,vb,vbulletin,ve,vegetables,vehicles,vendors,venues,verified,verizon,versions,versus,verzeichnis,vessels,veterans,veterinary,vhs,via,vibrator,vibrators,vic,victims,victorian,vid,videos,viewed,viewer,viewing,viewpicture,vignette,vignettes,vii,villa,village,villas,vincent,violations,violence,violent,virgin,virtually,viruses,visit,visited,visiting,visitors,visits,vista,vitamins,vocal,vocational,voiceovers,voices,vol,volkswagen,volt,volumes,voluntary,volunteers,volvo,von,vote,voted,voters,votes,voting,vp,vs,vt,w,wa,wage,wages,wait,wal,walked,walks,wallpaper,wallpapers,walls,walter,wanna,want,wanted,wanting,wants,ward,warner,warnings,warp,warranties,warren,warrior,wars,was,wash,washing,waste,watched,watches,watching,watson,watts,waves,wayne,ways,weak,wealth,weapons,wear,wearing,weblog,webmaster,webshots,websites,webster,wed,wedding,weddings,wednesday,weekend,weekends,weekly,weeks,weird,welcome,welfare,wells,welsh,went,were,wet,wheels,whenever,whether,whilst,whitebalance,whitespace,whole,wi,widely,wider,width,wife,wikipedia,wild,wilderness,wildlife,williams,willing,wilson,win,winds,windsor,wines,winners,winning,wins,wipe,wipes,wisdom,wise,wish,wishes,wizard,wolf,woman,women,womens,won,wonder,wonderful,wondering,wooden,woods,wordmark,wordmarks,wordpress,words,worked,worker,workers,workflows,working,workplace,works,workshops,world,worlds,worldsex,worldwide,worn,worry,worse,worship,worst,would,wow,wp,write,writers,writes,wrong,wrote,ws,wv,www,wy,xbox,xheight,xhtml,xl,xp,xx,y,yamaha,yards,ye,yeah,years,yes,yesterday,yn,yo,yoga,yorkshire,younger,yr,yu,z,za,zdnet,zealand,zen,zones,zoo,zope,zum,zus").split(",");

// ==================== COMMON MISSPELLINGS (direct correction map) =========
var COMMON_CORRECTIONS = {
    "recieve": "receive", "recieved": "received", "receieve": "receive",
    "definately": "definitely", "definate": "definite", "definitley": "definitely",
    "occured": "occurred", "occuring": "occurring", "occurence": "occurrence",
    "seperate": "separate", "seperated": "separated", "seperately": "separately",
    "alot": "a lot", "alright": "all right", "thier": "their",
    "teh": "the", "adress": "address", "wich": "which",
    "beleive": "believe", "belive": "believe", "acheive": "achieve",
    "acheivement": "achievement", "begining": "beginning", "bussiness": "business",
    "calender": "calendar", "comming": "coming", "comittee": "committee",
    "dissapoint": "disappoint", "enviroment": "environment",
    "existance": "existence", "familar": "familiar", "finaly": "finally",
    "flourescent": "fluorescent", "foriegn": "foreign", "foward": "forward",
    "freind": "friend", "futher": "further", "gaurd": "guard",
    "goverment": "government", "grammer": "grammar", "happend": "happened",
    "harrass": "harass", "heirarchy": "hierarchy", "humerous": "humorous",
    "immediatly": "immediately", "independant": "independent", "intresting": "interesting",
    "knowlege": "knowledge", "liason": "liaison", "libary": "library",
    "lisence": "license", "maintainance": "maintenance", "neccessary": "necessary",
    "noticable": "noticeable", "occassion": "occasion", "occassionally": "occasionally",
    "paralel": "parallel", "particullarly": "particularly",
    "posession": "possession", "publically": "publicly",
    "refered": "referred", "relevent": "relevant", "remeber": "remember",
    "restaraunt": "restaurant", "schedual": "schedule",
    "sentance": "sentence", "succesful": "successful", "sucess": "success",
    "sucessful": "successful", "tommorow": "tomorrow",
    "tounge": "tongue", "truely": "truly", "untill": "until",
    "vacume": "vacuum", "vehical": "vehicle", "wether": "whether",
    "wierd": "weird", "withold": "withhold", "writeing": "writing",
    "embarassed": "embarrassed", "embarasing": "embarrassing",
    "missepelling": "misspelling", "proffesional": "professional"
};

// ==================== DICTIONARY CATEGORIES ====================
var DICT_CATEGORIES = [
    "World_Leaders", "Countries_and_Territories", "Continents_and_Regions", "Cities_and_Capitals",
    "Monuments_and_Landmarks", "Natural_Disasters", "War_and_Conflict_Terms", "Emergency_and_Rescue_Vehicles",
    "Military_and_Defense_Terms", "Financial_Terms_and_Stock_Market", "Economic_Institutions_and_Policies",
    "Medical_People_and_Healthcare_Terms", "Hospitals_and_Medical_Facilities", "Universities_and_Colleges",
    "Science_and_Technology", "Space_and_Astronomy", "Transportation_and_Aviation", "Government_and_Politics",
    "Law_and_Justice", "Crime_and_Security", "Sports_and_Athletics", "Environmental_and_Climate_Terms",
    "Energy_and_Industry", "Infrastructure_and_Architecture", "Business_and_Corporations", "Journalism_and_Media",
    "Pop_Culture_and_Media_no_slang", "Art_and_Literature_no_authors", "Music_and_Performing_Arts",
    "Fashion_and_Design", "Education_and_Learning", "Food_and_Agriculture", "Weather_and_Climate",
    "Technology_and_Computing", "Transportation_Systems", "Historical_Events_2000_2025",
    "Communications_and_Social_Media", "Space_Exploration", "Marine_and_Oceanography", "Aviation_and_Aerospace",
    "Legal_Systems_and_Courts", "International_Organizations", "Commonly_Misspelled_Words_A_Z",
    "Grammar_and_Pronouns", "General_Vocabulary", "Custom_Dictionary"
];

// The built-in word lists themselves are compiled into dictionary-data.jsx
// (generated from Dictionary/*.txt) and loaded via #include below, so they
// exist the instant this script loads — no file path, install location, or
// OS permissions involved. Only user-added custom words (typed into the
// panel at runtime) still live in a small separate writable file.
#include "dictionary-data.jsx"

// ==================== GLOBAL STATE (persists across evalScript calls) =====
var dictionaryData = {
    words: {}, corrections: {}, loaded: {}, loadStatus: {},
    fallbackActive: false, dictionaryPath: null,
    customDictionaryLoaded: false, customDictionaryWordCount: 0,
    loadedAll: false, index: { prefix: {}, count: 0 }, suggestCache: {},
    totalLoaded: 0, totalMissing: 0
};

var sessionState = {
    customWords: {}, ignoredWords: {}, persistentIgnore: {},
    errors: null, order: [], findings: [], seenSigs: {},
    scope: "active", selectedLayerIndexes: null, filter: "all",
    options: { ignoreAllCaps: true, skipNumbers: true, allowStemming: true },
    filters: { ignoreHidden: false, ignoreLocked: false, selectedOnly: false, forceHighlightVisibility: false, disableGlobalHighlights: false },
    stats: { comps: 0, layers: 0, text: 0, expr: 0, effect: 0, name: 0, marker: 0, words: 0, errors: 0 },
    scanning: false,
    highlightsVisible: false,
    highlightedCompIds: {}
};

// ==================== UTILITY ====================
function logMessage(msg) {
    try { if (typeof $.writeln === "function") { $.writeln("[Motion Spell Checker] " + msg); } } catch (e) {}
}

function trimString(str) { if (!str) return ""; return String(str).replace(/^\s+|\s+$/g, ""); }

function escapeRegExp(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function arrayIndexOf(arr, val) {
    if (!arr) return -1;
    for (var i = 0; i < arr.length; i++) { if (arr[i] === val) return i; }
    return -1;
}

function getScriptFolder() {
    try { var sf = new File(HOST_SCRIPT_FILE_NAME); return (sf && sf.parent) ? sf.parent.fsName : null; }
    catch (e) { return null; }
}

function ensureDir(path) {
    try { var f = new Folder(path); if (!f.exists) { f.create(); } } catch (e) {}
}

// Only used for the small, writable files that hold words YOU add at
// runtime (customDictionary.txt, ignoredWords.txt) — the 100,000-word
// built-in dictionary is compiled into the extension itself (see
// dictionary-data.jsx) and never touches this path. Documents is used
// directly since it's reliably writable regardless of where or how the
// extension itself was installed (a fixed, user-owned CEP install
// folder can be read-only, especially for a system-wide install).
function getDictionaryPath() {
    if (dictionaryData.dictionaryPath) return dictionaryData.dictionaryPath;
    try {
        var sep = ($.os.indexOf("Win") >= 0) ? "\\" : "/";
        if (Folder.myDocuments && Folder.myDocuments.exists) {
            var d2 = new Folder(Folder.myDocuments.fsName + sep + "MotionSpellChecker" + sep + "Dictionary");
            if (!d2.exists) { try { d2.create(); } catch (ce2) {} }
            if (d2.exists) { dictionaryData.dictionaryPath = d2.fsName + sep; return dictionaryData.dictionaryPath; }
        }
    } catch (e) { logMessage("Error determining dictionary path: " + e.toString()); }
    return null;
}

// ==================== WORD TOKENIZER ====================
function splitIntoWords(text) {
    if (!text) return [];
    var s = String(text);
    s = s.replace(/[\u2018\u2019]/g, "'");
    s = s.replace(/[\u201C\u201D]/g, '"');
    s = s.replace(/[\u2013\u2014]/g, " ");
    s = s.replace(/[.,\/#!$%\^&\*;:{}=\_`~()<>?@\[\]\\+|"\-]/g, " ");
    var parts = s.split(/[\s\n\r\t]+/);
    var words = [];
    for (var i = 0; i < parts.length; i++) {
        var w = trimString(parts[i]).replace(/^['-]+|['-]+$/g, "");
        if (w.length > 0 && !/^\d+$/.test(w)) words.push(w);
    }
    return words;
}

function shouldSkipWord(word) {
    if (!word) return true;
    if (word.length === 1) return true;
    if (/\d/.test(word) && sessionState.options.skipNumbers) return true;
    if (sessionState.options.ignoreAllCaps &&
        word.length >= 2 && word === word.toUpperCase() && word !== word.toLowerCase()) {
        return true;
    }
    return false;
}

function stemWord(w) {
    var out = [];
    if (!w || w.length <= 4) return out;
    var n = w.length;
    function push(x) { if (x && x.length >= 2) out.push(x); }
    if (w.slice(-3) === "ies") push(w.slice(0, n - 3) + "y");
    if (w.slice(-2) === "es") push(w.slice(0, n - 2));
    if (w.slice(-1) === "s") push(w.slice(0, n - 1));
    if (w.slice(-3) === "ing" && n > 5) {
        var b = w.slice(0, n - 3);
        push(b); push(b + "e");
        if (b.length >= 2 && b.charAt(b.length - 1) === b.charAt(b.length - 2)) push(b.slice(0, -1));
    }
    if (w.slice(-3) === "ied" && n > 5) push(w.slice(0, n - 3) + "y");
    if (w.slice(-2) === "ed" && n > 5) {
        var b2 = w.slice(0, n - 2);
        push(b2); push(b2 + "e");
        if (b2.length >= 2 && b2.charAt(b2.length - 1) === b2.charAt(b2.length - 2)) push(b2.slice(0, -1));
    } else if (w.slice(-1) === "d" && n > 5) { push(w.slice(0, n - 1)); }
    if (w.slice(-3) === "est" && n > 5) push(w.slice(0, n - 3));
    if (w.slice(-2) === "er" && n > 5) push(w.slice(0, n - 2));
    if (w.slice(-2) === "ly" && n > 5) push(w.slice(0, n - 2));
    if (w.slice(-2) === "'s") push(w.slice(0, n - 2));
    if (w.slice(-2) === "s'") push(w.slice(0, n - 2));
    return out;
}

function isWordCorrect(word) {
    if (!word) return true;
    var lower = word.toLowerCase();
    if (sessionState.customWords[lower]) return true;
    if (sessionState.ignoredWords[lower]) return true;
    if (sessionState.persistentIgnore[lower]) return true;
    if (dictionaryData.words[lower] === true) return true;
    if (sessionState.options.allowStemming) {
        var stems = stemWord(lower);
        for (var i = 0; i < stems.length; i++) { if (dictionaryData.words[stems[i]] === true) return true; }
    }
    return false;
}

// ==================== DICTIONARY MANAGEMENT ====================
// Words are indexed for suggestion-matching (by 1-2 letter prefix) as they're
// added, rather than in one separate for-in pass over the whole dictionary
// afterward — a plain for-in over tens of thousands of dynamic properties is
// a genuinely slow operation in ExtendScript's engine, unlike a modern
// browser's. Adding the index update to each insertion keeps total load time
// linear and fast even at 50,000+ words.
function addDictionaryWord(w) {
    if (dictionaryData.words[w] === true) return;
    dictionaryData.words[w] = true;
    dictionaryData.index.count++;
    var key = w.length >= 2 ? w.slice(0, 2) : w.slice(0, 1);
    if (!dictionaryData.index.prefix[key]) dictionaryData.index.prefix[key] = [];
    dictionaryData.index.prefix[key].push(w);
}

function initializeFallbackDictionary() {
    dictionaryData.fallbackActive = true;
    for (var i = 0; i < FALLBACK_DICTIONARY.length; i++) {
        addDictionaryWord(String(FALLBACK_DICTIONARY[i]).toLowerCase());
    }
    logMessage("Fallback dictionary loaded (" + FALLBACK_DICTIONARY.length + " words)");
    return FALLBACK_DICTIONARY.length;
}

function loadCorrections() {
    for (var k in COMMON_CORRECTIONS) {
        if (COMMON_CORRECTIONS.hasOwnProperty(k)) dictionaryData.corrections[k] = COMMON_CORRECTIONS[k];
    }
}

function loadCustomDictionaryFile() {
    var dictPath = getDictionaryPath();
    if (!dictPath) return { success: false, wordCount: 0 };
    var file = new File(dictPath + "customDictionary.txt");
    if (!file.exists) return { success: false, wordCount: 0, notFound: true };
    try {
        file.encoding = "UTF-8";
        if (!file.open("r")) return { success: false, wordCount: 0 };
        var wordCount = 0;
        while (!file.eof) {
            try {
                var line = trimString(file.readln());
                if (line.length === 0 || line.charAt(0) === "#") continue;
                var word = line.toLowerCase();
                if (word) { addDictionaryWord(word); wordCount++; }
            } catch (le) {}
        }
        file.close();
        dictionaryData.customDictionaryLoaded = true;
        dictionaryData.customDictionaryWordCount = wordCount;
        return { success: true, wordCount: wordCount };
    } catch (e) {
        try { file.close(); } catch (ce) {}
        return { success: false, wordCount: 0 };
    }
}

function loadIgnoreFile() {
    var dictPath = getDictionaryPath();
    if (!dictPath) return;
    var file = new File(dictPath + "ignoredWords.txt");
    if (!file.exists) return;
    try {
        file.encoding = "UTF-8";
        if (!file.open("r")) return;
        while (!file.eof) {
            try {
                var line = trimString(file.readln());
                if (line.length === 0 || line.charAt(0) === "#") continue;
                sessionState.persistentIgnore[line.toLowerCase()] = true;
            } catch (le) {}
        }
        file.close();
    } catch (e) { try { file.close(); } catch (ce) {} }
}

function loadDictionaryFile(category) {
    if (dictionaryData.loaded[category]) return { success: true, cached: true };
    var entry = EMBEDDED_DICTIONARY[category];
    if (!entry) { dictionaryData.loadStatus[category] = { status: "missing", message: "Not embedded" }; return { success: false, missing: true }; }
    var wordCount = 0, correctionCount = 0;
    for (var i = 0; i < entry.words.length; i++) {
        addDictionaryWord(entry.words[i]);
        wordCount++;
    }
    for (var k in entry.corrections) {
        if (entry.corrections.hasOwnProperty(k)) { dictionaryData.corrections[k] = entry.corrections[k]; correctionCount++; }
    }
    if (wordCount > 0 || correctionCount > 0) {
        dictionaryData.loaded[category] = true;
        dictionaryData.loadStatus[category] = { status: "loaded", message: wordCount + " words, " + correctionCount + " corrections" };
        return { success: true, words: wordCount, corrections: correctionCount };
    }
    dictionaryData.loadStatus[category] = { status: "empty", message: "Empty" };
    return { success: false, empty: true };
}

function loadAllDictionaries() {
    var loaded = 0, missing = 0, failed = 0;
    for (var i = 0; i < DICT_CATEGORIES.length; i++) {
        var r = loadDictionaryFile(DICT_CATEGORIES[i]);
        if (r.success && !r.cached) loaded++;
        else if (r.missing) missing++;
        else if (!r.success) failed++;
    }
    return { loaded: loaded, missing: missing, failed: failed, total: DICT_CATEGORIES.length };
}

function buildWordIndex() {
    // Index is now built incrementally by addDictionaryWord() as each word
    // is loaded (see above) — nothing left to do here except report the count.
    return dictionaryData.index.count;
}

function ensureDictionariesLoaded() {
    if (dictionaryData.loadedAll) return;
    initializeFallbackDictionary();
    loadCorrections();
    loadCustomDictionaryFile();
    loadIgnoreFile();
    var res = loadAllDictionaries();
    buildWordIndex();
    dictionaryData.loadedAll = true;
    dictionaryData.totalLoaded = res.loaded;
    dictionaryData.totalMissing = res.missing;
    logMessage("Dictionaries ready: " + res.loaded + " categories loaded, " + res.missing + " missing");
}

function getSuggestionForWord(word) {
    if (!word) return null;
    return dictionaryData.corrections[word.toLowerCase()] || null;
}

// ==================== SUGGESTIONS ====================
function levenshtein(a, b) {
    if (!a || !b) return 999;
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 3) return 999;
    var m = [];
    for (var i = 0; i <= b.length; i++) m[i] = [i];
    for (var j = 0; j <= a.length; j++) m[0][j] = j;
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) m[i][j] = m[i - 1][j - 1];
            else m[i][j] = Math.min(m[i - 1][j - 1] + 1, m[i][j - 1] + 1, m[i - 1][j] + 1);
        }
    }
    return m[b.length][a.length];
}

function collectCandidateKeys(lower) {
    var keys = [], seen = {};
    function push(k) { if (k && !seen[k]) { seen[k] = true; keys.push(k); } }
    push(lower.slice(0, 2));
    push(lower.slice(0, 1));
    if (lower.length >= 2) push(lower.charAt(1) + lower.charAt(0));
    return keys;
}

function generateSuggestions(word, max) {
    max = max || 6;
    if (!word) return [];
    var lower = word.toLowerCase();
    if (dictionaryData.suggestCache[lower]) return dictionaryData.suggestCache[lower].slice(0, max);
    var out = [];
    var direct = getSuggestionForWord(word);
    if (direct && arrayIndexOf(out, direct) < 0) out.push(direct);
    var idx = dictionaryData.index;
    var candidates = [], seen = {};
    if (idx) {
        var keys = collectCandidateKeys(lower);
        for (var ki = 0; ki < keys.length; ki++) {
            var bucket = idx.prefix[keys[ki]];
            if (!bucket) continue;
            for (var bi = 0; bi < bucket.length; bi++) {
                var dictWord = bucket[bi];
                if (seen[dictWord]) continue;
                seen[dictWord] = true;
                if (Math.abs(dictWord.length - lower.length) > 3) continue;
                var dist = levenshtein(lower, dictWord);
                if (dist <= 3) candidates.push({ word: dictWord, distance: dist });
            }
        }
    }
    candidates.sort(function (a, b) { if (a.distance !== b.distance) return a.distance - b.distance; return a.word < b.word ? -1 : (a.word > b.word ? 1 : 0); });
    for (var i = 0; i < candidates.length && out.length < max; i++) {
        if (arrayIndexOf(out, candidates[i].word) < 0) out.push(candidates[i].word);
    }
    dictionaryData.suggestCache[lower] = out;
    return out.slice(0, max);
}

// ==================== SCANNER ====================
function addFinding(f, findings, seen) {
    var sig = f.sourceType + "|" + f.compId + "|" +
        (f.layerIndex === null || f.layerIndex === undefined ? "" : f.layerIndex) + "|" +
        (f.propertyPath || "") + "|" + (f.text || "");
    if (seen[sig]) {
        var existing = seen[sig];
        if (f.keyIndexes) {
            for (var i = 0; i < f.keyIndexes.length; i++) {
                if (arrayIndexOf(existing.keyIndexes, f.keyIndexes[i]) < 0) existing.keyIndexes.push(f.keyIndexes[i]);
            }
        }
        return;
    }
    if (!f.keyIndexes) f.keyIndexes = [];
    f._sig = sig;
    seen[sig] = f;
    findings.push(f);
}

function extractStringLiterals(expr) {
    var out = [];
    if (!expr) return out;
    var re = /["']([^"'\\]*(\\.[^"'\\]*)*)["']/g;
    var m;
    while ((m = re.exec(expr)) !== null) {
        var token = m[0];
        var quote = token.charAt(0);
        var inner = token.slice(1, -1);
        inner = inner.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, " ").replace(/\\t/g, " ").replace(/\\r/g, " ");
        if (inner.length > 0) out.push({ value: inner, quote: quote });
    }
    return out;
}

function scanTextDocumentProperty(prop, comp, layer, findings, seen, path) {
    var entries = [];
    try { var v = prop.value; if (v && typeof v.text === "string" && v.text.length > 0) entries.push({ key: null, text: v.text }); } catch (e) {}
    if (prop.numKeys > 0) {
        for (var k = 1; k <= prop.numKeys; k++) {
            try { var kv = prop.keyValue(k); if (kv && typeof kv.text === "string" && kv.text.length > 0) entries.push({ key: k, text: kv.text }); } catch (e) {}
        }
    }
    var byText = {}, textOrder = [];
    for (var i = 0; i < entries.length; i++) {
        var t = entries[i].text;
        if (!byText[t]) { byText[t] = []; textOrder.push(t); }
        if (entries[i].key !== null) byText[t].push(entries[i].key);
    }
    for (var ti = 0; ti < textOrder.length; ti++) {
        var txt = textOrder[ti];
        addFinding({ sourceType: "text", comp: comp, compName: comp.name, compId: comp.id, layer: layer, layerIndex: layer.index, layerName: layer.name, property: prop, propertyPath: path, propKind: "text", text: txt, keyIndexes: byText[txt] }, findings, seen);
    }
}

function scanStringProperty(prop, comp, layer, findings, seen, path) {
    var entries = [];
    try { var v = prop.value; if (typeof v === "string" && v.length > 0) entries.push({ key: null, text: v }); } catch (e) {}
    if (prop.numKeys > 0) {
        for (var k = 1; k <= prop.numKeys; k++) {
            try { var kv = prop.keyValue(k); if (typeof kv === "string" && kv.length > 0) entries.push({ key: k, text: kv }); } catch (e) {}
        }
    }
    var byText = {}, textOrder = [];
    for (var i = 0; i < entries.length; i++) {
        var t = entries[i].text;
        if (!byText[t]) { byText[t] = []; textOrder.push(t); }
        if (entries[i].key !== null) byText[t].push(entries[i].key);
    }
    for (var ti = 0; ti < textOrder.length; ti++) {
        var txt = textOrder[ti];
        addFinding({ sourceType: "effect", comp: comp, compName: comp.name, compId: comp.id, layer: layer, layerIndex: layer.index, layerName: layer.name, property: prop, propertyPath: path, propKind: "string", text: txt, keyIndexes: byText[txt] }, findings, seen);
    }
}

function scanMarkerProperty(prop, comp, layer, findings, seen) {
    if (!prop || prop.numKeys <= 0) return;
    var byText = {}, textOrder = [];
    for (var k = 1; k <= prop.numKeys; k++) {
        try {
            var mk = prop.keyValue(k);
            if (mk && mk.comment && mk.comment.length > 0) {
                if (!byText[mk.comment]) { byText[mk.comment] = []; textOrder.push(mk.comment); }
                byText[mk.comment].push(k);
            }
        } catch (e) {}
    }
    for (var ti = 0; ti < textOrder.length; ti++) {
        var txt = textOrder[ti];
        addFinding({ sourceType: "marker", comp: comp, compName: comp.name, compId: comp.id, layer: layer, layerIndex: layer ? layer.index : null, layerName: layer ? layer.name : "", property: prop, propertyPath: layer ? "Layer Markers" : "Comp Markers", propKind: "marker", text: txt, keyIndexes: byText[txt] }, findings, seen);
    }
}

function scanProp(prop, comp, layer, findings, seen, path) {
    if (!prop) return;
    var mn;
    try { mn = prop.matchName; } catch (e) { mn = ""; }
    if (prop.expressionEnabled && prop.expression) {
        var lits = extractStringLiterals(prop.expression);
        for (var li = 0; li < lits.length; li++) {
            addFinding({ sourceType: "expression", comp: comp, compName: comp.name, compId: comp.id, layer: layer, layerIndex: layer.index, layerName: layer.name, property: prop, propertyPath: path + " (expression)", propKind: "expression", text: lits[li].value, quote: lits[li].quote, keyIndexes: [] }, findings, seen);
        }
    }
    var isGroup = (prop.numProperties !== undefined && prop.numProperties > 0);
    if (isGroup) {
        for (var i = 1; i <= prop.numProperties; i++) {
            var child;
            try { child = prop.property(i); } catch (e) { continue; }
            if (!child) continue;
            var childName;
            try { childName = child.name || child.matchName; } catch (e) { childName = ""; }
            scanProp(child, comp, layer, findings, seen, path + "/" + childName);
        }
        return;
    }
    try {
        if (mn === "ADBE Text Document") { scanTextDocumentProperty(prop, comp, layer, findings, seen, path); return; }
        if (mn === "ADBE Marker") return;
        var v = prop.value;
        if (typeof v === "string" && v.length > 0) scanStringProperty(prop, comp, layer, findings, seen, path);
    } catch (e) {}
}

function layerPassesFilters(layer, filters) {
    try {
        if (filters.ignoreHidden && layer.enabled === false) return false;
    } catch (e) {}
    try {
        if (filters.ignoreLocked && layer.locked === true) return false;
    } catch (e) {}
    try {
        if (filters.selectedOnly && layer.selected !== true) return false;
    } catch (e) {}
    return true;
}

function scanLayer(layer, comp, findings, seen, stats) {
    if (!layer) return;
    stats.layers++;
    addFinding({ sourceType: "layerName", comp: comp, compName: comp.name, compId: comp.id, layer: layer, layerIndex: layer.index, layerName: layer.name, property: null, propertyPath: "Layer Name", propKind: "layerName", text: layer.name, keyIndexes: [] }, findings, seen);
    try { var mp = layer.property("ADBE Marker"); if (mp) scanMarkerProperty(mp, comp, layer, findings, seen); } catch (e) {}
    scanProp(layer, comp, layer, findings, seen, "");
}

function scanComp(comp, findings, seen, stats, filters) {
    if (!comp || !(comp instanceof CompItem)) return;
    stats.comps++;
    addFinding({ sourceType: "compName", comp: comp, compName: comp.name, compId: comp.id, layer: null, layerIndex: null, layerName: "", property: null, propertyPath: "Comp Name", propKind: "compName", text: comp.name, keyIndexes: [] }, findings, seen);
    try { var cmp = comp.markerProperty; if (cmp) scanMarkerProperty(cmp, comp, null, findings, seen); } catch (e) {}
    var scopeFilter = (sessionState.scope === "selected") ? sessionState.selectedLayerIndexes : null;
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer;
        try { layer = comp.layer(i); } catch (e) { continue; }
        if (scopeFilter && !scopeFilter[layer.index]) continue;
        if (!layerPassesFilters(layer, filters)) continue;
        scanLayer(layer, comp, findings, seen, stats);
    }
}

function getSelectedLayerIndexes(comp) {
    var map = {};
    try { var sel = comp.selectedLayers; if (sel) { for (var i = 0; i < sel.length; i++) map[sel[i].index] = true; } } catch (e) {}
    return map;
}

function collectCompsForScope() {
    var comps = [], seen = {};
    function add(c) { if (c && (c instanceof CompItem) && !seen[c.id]) { seen[c.id] = true; comps.push(c); } }
    if (!app.project) return comps;
    var active = app.project.activeItem;
    if (sessionState.scope === "selected") {
        if (active instanceof CompItem) { add(active); sessionState.selectedLayerIndexes = getSelectedLayerIndexes(active); }
    } else if (sessionState.scope === "selectedComps") {
        try {
            var projSel = app.project.selection;
            if (projSel) { for (var si = 0; si < projSel.length; si++) { if (projSel[si] instanceof CompItem) add(projSel[si]); } }
        } catch (e) {}
    } else if (sessionState.scope === "project") {
        for (var i = 1; i <= app.project.numItems; i++) { try { add(app.project.item(i)); } catch (e) {} }
    } else {
        if (active instanceof CompItem) {
            var queue = [active];
            while (queue.length > 0) {
                var c = queue.shift();
                add(c);
                for (var li = 1; li <= c.numLayers; li++) {
                    try { var lyr = c.layer(li); if (lyr.source && (lyr.source instanceof CompItem)) queue.push(lyr.source); } catch (e) {}
                }
            }
        }
    }
    return comps;
}

// ==================== ANALYSIS ====================
function analyzeFindings(findings) {
    var errors = {}, order = [], totalWords = 0;
    var stats = { text: 0, expr: 0, effect: 0, name: 0, marker: 0 };
    for (var f = 0; f < findings.length; f++) {
        var finding = findings[f];
        if (finding.sourceType === "text") stats.text++;
        else if (finding.sourceType === "expression") stats.expr++;
        else if (finding.sourceType === "effect") stats.effect++;
        else if (finding.sourceType === "layerName" || finding.sourceType === "compName") stats.name++;
        else if (finding.sourceType === "marker") stats.marker++;
        var words = splitIntoWords(finding.text);
        for (var w = 0; w < words.length; w++) {
            var word = words[w];
            totalWords++;
            if (shouldSkipWord(word)) continue;
            if (isWordCorrect(word)) continue;
            var lower = word.toLowerCase();
            if (!errors[lower]) { errors[lower] = { word: word, lower: lower, count: 0, locations: [], seenLocs: {} }; order.push(lower); }
            var err = errors[lower];
            var locSig = finding._sig;
            if (!err.seenLocs[locSig]) { err.seenLocs[locSig] = true; err.locations.push({ finding: finding, label: buildLocationLabel(finding) }); err.count++; }
        }
    }
    return { errors: errors, order: order, totalWords: totalWords, stats: stats };
}

function buildLocationLabel(finding) {
    var src;
    if (finding.sourceType === "text") src = "Text";
    else if (finding.sourceType === "expression") src = "Expression";
    else if (finding.sourceType === "effect") src = "Effect";
    else if (finding.sourceType === "marker") src = "Marker";
    else if (finding.sourceType === "layerName") src = "Layer name";
    else if (finding.sourceType === "compName") src = "Comp name";
    else src = finding.sourceType;
    var compPart = "Comp \"" + finding.compName + "\"";
    if (finding.layer) return compPart + " \u00B7 Layer " + finding.layerIndex + " \"" + finding.layerName + "\" (" + src + ")";
    return compPart + " (" + src + ")";
}

// ==================== CORRECTIONS ====================
function matchCase(src, tgt) {
    if (!src || !tgt) return tgt;
    if (src === src.toUpperCase() && src !== src.toLowerCase()) return tgt.toUpperCase();
    if (src.charAt(0) === src.charAt(0).toUpperCase()) return tgt.charAt(0).toUpperCase() + tgt.slice(1);
    return tgt;
}

function replaceWordInString(str, oldWord, newWord) {
    if (!str || !oldWord) return str;
    var re = new RegExp("\\b" + escapeRegExp(oldWord) + "\\b", "gi");
    var result = "", last = 0, m;
    while ((m = re.exec(str)) !== null) {
        result += str.slice(last, m.index);
        result += matchCase(m[0], newWord);
        last = m.index + m[0].length;
        if (m.index === re.lastIndex) re.lastIndex++;
    }
    result += str.slice(last);
    return result;
}

function replaceInTextDocument(finding, oldWord, newWord) {
    var prop = finding.property, count = 0;
    if (finding.keyIndexes && finding.keyIndexes.length > 0) {
        for (var i = 0; i < finding.keyIndexes.length; i++) {
            var k = finding.keyIndexes[i];
            if (k > prop.numKeys) continue;
            try {
                var doc = prop.keyValue(k);
                if (!doc) continue;
                var newText = replaceWordInString(doc.text, oldWord, newWord);
                if (newText !== doc.text) { doc.text = newText; prop.setValueAtKey(k, doc); count++; }
            } catch (e) {}
        }
    } else {
        try {
            var doc2 = prop.value;
            if (doc2) { var newText2 = replaceWordInString(doc2.text, oldWord, newWord); if (newText2 !== doc2.text) { doc2.text = newText2; prop.setValue(doc2); count++; } }
        } catch (e) {}
    }
    return { success: count > 0, count: count };
}

function replaceInStringProp(finding, oldWord, newWord) {
    var prop = finding.property, count = 0;
    if (finding.keyIndexes && finding.keyIndexes.length > 0) {
        for (var i = 0; i < finding.keyIndexes.length; i++) {
            var k = finding.keyIndexes[i];
            if (k > prop.numKeys) continue;
            try {
                var kv = prop.keyValue(k);
                if (typeof kv !== "string") continue;
                var newVal = replaceWordInString(kv, oldWord, newWord);
                if (newVal !== kv) { prop.setValueAtKey(k, newVal); count++; }
            } catch (e) {}
        }
    } else {
        try {
            var v = prop.value;
            if (typeof v === "string") { var newVal2 = replaceWordInString(v, oldWord, newWord); if (newVal2 !== v) { prop.setValue(newVal2); count++; } }
        } catch (e) {}
    }
    return { success: count > 0, count: count };
}

function replaceInMarker(finding, oldWord, newWord) {
    var prop = finding.property, count = 0;
    if (finding.keyIndexes && finding.keyIndexes.length > 0) {
        for (var i = 0; i < finding.keyIndexes.length; i++) {
            var k = finding.keyIndexes[i];
            if (k > prop.numKeys) continue;
            try {
                var mk = prop.keyValue(k);
                if (!mk) continue;
                var newComment = replaceWordInString(mk.comment, oldWord, newWord);
                if (newComment !== mk.comment) {
                    var newMk = new MarkerValue(newComment);
                    try { newMk.duration = mk.duration; } catch (e) {}
                    try { newMk.label = mk.label; } catch (e) {}
                    prop.setValueAtKey(k, newMk);
                    count++;
                }
            } catch (e) {}
        }
    }
    return { success: count > 0, count: count };
}

function replaceInExpression(finding, oldWord, newWord) {
    var prop = finding.property;
    try {
        var expr = prop.expression;
        if (!expr) return { success: false, count: 0 };
        var literal = finding.text;
        var quote = finding.quote || '"';
        var newLiteral = replaceWordInString(literal, oldWord, newWord);
        if (newLiteral === literal) return { success: false, count: 0 };
        var oldToken = quote + literal + quote;
        var newToken = quote + newLiteral + quote;
        var newExpr = expr.split(oldToken).join(newToken);
        if (newExpr !== expr) { prop.expression = newExpr; return { success: true, count: 1 }; }
        return { success: false, count: 0 };
    } catch (e) { return { success: false, count: 0 }; }
}

function applyCorrection(finding, oldWord, newWord) {
    try {
        if (finding.propKind === "text") return replaceInTextDocument(finding, oldWord, newWord);
        if (finding.propKind === "string") return replaceInStringProp(finding, oldWord, newWord);
        if (finding.propKind === "marker") return replaceInMarker(finding, oldWord, newWord);
        if (finding.propKind === "expression") return replaceInExpression(finding, oldWord, newWord);
        if (finding.propKind === "layerName") {
            var nn = replaceWordInString(finding.layer.name, oldWord, newWord);
            if (nn !== finding.layer.name) { finding.layer.name = nn; return { success: true, count: 1 }; }
            return { success: false, count: 0 };
        }
        if (finding.propKind === "compName") {
            var nc = replaceWordInString(finding.comp.name, oldWord, newWord);
            if (nc !== finding.comp.name) { finding.comp.name = nc; return { success: true, count: 1 }; }
            return { success: false, count: 0 };
        }
    } catch (e) { return { success: false, count: 0, error: e.toString() }; }
    return { success: false, count: 0 };
}

function persistCustomWord(word) {
    var dictPath = getDictionaryPath();
    if (!dictPath) return false;
    try {
        ensureDir(dictPath);
        var file = new File(dictPath + "customDictionary.txt");
        file.encoding = "UTF-8";
        file.open(file.exists ? "a" : "w");
        file.writeln(word.toLowerCase());
        file.close();
        return true;
    } catch (e) { return false; }
}

function persistIgnoredWord(word) {
    var dictPath = getDictionaryPath();
    if (!dictPath) return false;
    try {
        ensureDir(dictPath);
        var file = new File(dictPath + "ignoredWords.txt");
        file.encoding = "UTF-8";
        file.open(file.exists ? "a" : "w");
        file.writeln(word.toLowerCase());
        file.close();
        return true;
    } catch (e) { return false; }
}

// ==================== DICTIONARY VERIFY ====================
function readDictionaryFileForTest(dictPath, cat) {
    var info = { name: cat, status: "missing", words: 0, corrections: 0, note: "" };
    var entry = EMBEDDED_DICTIONARY[cat];
    if (!entry) return info;
    var wordCount = entry.words.length;
    var correctionCount = 0;
    for (var k in entry.corrections) { if (entry.corrections.hasOwnProperty(k)) correctionCount++; }
    if (wordCount > 0 || correctionCount > 0) {
        info.status = "loaded"; info.words = wordCount; info.corrections = correctionCount;
    } else { info.status = "empty"; }
    return info;
}

function verifyDictionaries() {
    ensureDictionariesLoaded();
    var dictPath = getDictionaryPath();
    var results = [];
    var loaded = 0, missing = 0, empty = 0, error = 0, fileWords = 0, fileCorrections = 0;
    for (var i = 0; i < DICT_CATEGORIES.length; i++) {
        var info = readDictionaryFileForTest(dictPath, DICT_CATEGORIES[i]);
        results.push(info);
        if (info.status === "loaded") { loaded++; fileWords += info.words; fileCorrections += info.corrections; }
        else if (info.status === "missing") missing++;
        else if (info.status === "empty") empty++;
        else error++;
    }
    return {
        dictionaryPath: dictPath || "(not found)",
        extensionRootPath: EXTENSION_ROOT_PATH || "(not set)",
        extensionRootDiag: EXTENSION_ROOT_DIAG,
        categories: results,
        loaded: loaded, missing: missing, empty: empty, error: error,
        fileWords: fileWords, fileCorrections: fileCorrections,
        fallbackWords: FALLBACK_DICTIONARY.length,
        customWords: dictionaryData.customDictionaryWordCount
    };
}

// ==================== VIEWER HIGHLIGHTING ====================
// Draws a red outline box around every layer that contains a spelling error,
// directly in the Composition viewer, using a non-rendering guide shape
// layer named HIGHLIGHT_LAYER_NAME (one per comp). This mirrors the on-canvas
// highlight feature of reference spellcheckers: it never touches the layers
// themselves, is excluded from render (guideLayer), and is fully cleared by
// csClearHighlights() or the next scan.
//
// The box is an axis-aligned bounding rectangle computed by walking the
// layer's parent chain and applying each ancestor's 2D transform (position,
// anchor point, scale, rotation) to the layer's sourceRectAtTime() corners.
// 3D tilt/z-position is intentionally ignored — this is a visual aid, not a
// precise render-space projection.

function affineTransformPoint(pt, anchor, position, scale, rotationDeg) {
    var rad = (rotationDeg || 0) * Math.PI / 180;
    var dx = (pt[0] - anchor[0]) * ((scale[0] || 100) / 100);
    var dy = (pt[1] - anchor[1]) * ((scale[1] || 100) / 100);
    var rx = dx * Math.cos(rad) - dy * Math.sin(rad);
    var ry = dx * Math.sin(rad) + dy * Math.cos(rad);
    return [rx + position[0], ry + position[1]];
}

function valueAtTimeSafe(prop, t, fallback) {
    try { if (prop && prop.valueAtTime) return prop.valueAtTime(t, false); } catch (e) {}
    return fallback;
}

function getLayerCornersInComp(layer, t) {
    var rect;
    try { rect = layer.sourceRectAtTime(t, false); } catch (e) { return null; }
    if (!rect) return null;
    var corners = [
        [rect.left, rect.top],
        [rect.left + rect.width, rect.top],
        [rect.left + rect.width, rect.top + rect.height],
        [rect.left, rect.top + rect.height]
    ];
    var cur = layer, hops = 0;
    while (cur && hops < 12) {
        hops++;
        var anchor = valueAtTimeSafe(cur.anchorPoint, t, [0, 0]);
        var position = valueAtTimeSafe(cur.position, t, [0, 0]);
        var scale = valueAtTimeSafe(cur.scale, t, [100, 100]);
        var rotation = valueAtTimeSafe(cur.rotation, t, 0);
        for (var i = 0; i < corners.length; i++) {
            corners[i] = affineTransformPoint(corners[i], anchor, position, scale, rotation);
        }
        var parent = null;
        try { parent = cur.parent; } catch (e) { parent = null; }
        cur = parent;
    }
    return corners;
}

function boundingBoxFromCorners(corners, pad) {
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (var i = 0; i < corners.length; i++) {
        var p = corners[i];
        if (p[0] < minX) minX = p[0];
        if (p[0] > maxX) maxX = p[0];
        if (p[1] < minY) minY = p[1];
        if (p[1] > maxY) maxY = p[1];
    }
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;
    return [[minX, minY], [maxX, minY], [maxX, maxY], [minX, maxY]];
}

function findLayerByName(comp, name) {
    for (var i = 1; i <= comp.numLayers; i++) {
        var l;
        try { l = comp.layer(i); } catch (e) { continue; }
        if (l.name === name) return l;
    }
    return null;
}

function ensureHighlightLayer(comp) {
    var existing = findLayerByName(comp, HIGHLIGHT_LAYER_NAME);
    if (existing) { try { removeAllShapeGroups(existing); return existing; } catch (e) { try { existing.remove(); } catch (re) {} } }
    var shapeLayer = comp.layers.addShape();
    shapeLayer.name = HIGHLIGHT_LAYER_NAME;
    try { shapeLayer.guideLayer = true; } catch (e) {}
    try { shapeLayer.property("ADBE Transform Group").property("ADBE Position").setValue([0, 0]); } catch (e) {}
    try { shapeLayer.property("ADBE Transform Group").property("ADBE Anchor Point").setValue([0, 0]); } catch (e) {}
    return shapeLayer;
}

function removeAllShapeGroups(shapeLayer) {
    var contents = shapeLayer.property("ADBE Root Vectors Group");
    if (!contents) return;
    for (var i = contents.numProperties; i >= 1; i--) {
        try { contents.property(i).remove(); } catch (e) {}
    }
}

function addHighlightRect(shapeLayer, corners, colorRGB, label) {
    try {
        var contents = shapeLayer.property("ADBE Root Vectors Group");
        var group = contents.addProperty("ADBE Vector Group");
        group.name = label || "Highlight";
        var groupContents = group.property("ADBE Vectors Group");
        var pathProp = groupContents.addProperty("ADBE Vector Shape - Group");
        var shape = new Shape();
        shape.vertices = corners;
        shape.inTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
        shape.outTangents = [[0, 0], [0, 0], [0, 0], [0, 0]];
        shape.closed = true;
        pathProp.property("ADBE Vector Shape").setValue(shape);
        var strokeProp = groupContents.addProperty("ADBE Vector Graphic - Stroke");
        strokeProp.property("ADBE Vector Stroke Color").setValue(colorRGB);
        strokeProp.property("ADBE Vector Stroke Width").setValue(2);
        return true;
    } catch (e) { return false; }
}

function collectErroredLayersByComp() {
    var byComp = {};
    if (!sessionState.errors) return byComp;
    for (var lower in sessionState.errors) {
        if (!sessionState.errors.hasOwnProperty(lower)) continue;
        var err = sessionState.errors[lower];
        for (var i = 0; i < err.locations.length; i++) {
            var f = err.locations[i].finding;
            if (!f.layer || !f.comp) continue;
            var cid = f.comp.id;
            if (!byComp[cid]) byComp[cid] = { comp: f.comp, layers: {} };
            byComp[cid].layers[f.layerIndex] = f.layer;
        }
    }
    return byComp;
}

function clearHighlightsInComp(comp) {
    var existing;
    while ((existing = findLayerByName(comp, HIGHLIGHT_LAYER_NAME))) {
        try { existing.remove(); } catch (e) { break; }
    }
}

function clearAllHighlights() {
    if (!app.project) return;
    for (var i = 1; i <= app.project.numItems; i++) {
        var item;
        try { item = app.project.item(i); } catch (e) { continue; }
        if (item instanceof CompItem) { try { clearHighlightsInComp(item); } catch (e2) {} }
    }
    sessionState.highlightedCompIds = {};
}

function generateHighlights(forceVisibility) {
    clearAllHighlights();
    if (!app.project) return 0;
    var byComp = collectErroredLayersByComp();
    var count = 0;
    for (var cid in byComp) {
        if (!byComp.hasOwnProperty(cid)) continue;
        var entry = byComp[cid];
        var comp = entry.comp;
        try {
            var shapeLayer = ensureHighlightLayer(comp);
            var t = comp.time;
            for (var li in entry.layers) {
                if (!entry.layers.hasOwnProperty(li)) continue;
                var layer = entry.layers[li];
                try {
                    if (forceVisibility) { try { layer.enabled = true; } catch (e0) {} }
                    else { try { if (layer.enabled === false) continue; } catch (e1) {} }
                    var corners = getLayerCornersInComp(layer, t);
                    if (!corners) continue;
                    var box = boundingBoxFromCorners(corners, 6);
                    if (addHighlightRect(shapeLayer, box, [1, 0.28, 0.28], layer.name)) count++;
                } catch (e3) {}
            }
            sessionState.highlightedCompIds[cid] = true;
        } catch (e4) {}
    }
    sessionState.highlightsVisible = true;
    return count;
}

function toggleHighlightVisibility() {
    if (!app.project) return sessionState.highlightsVisible;
    var newState = !sessionState.highlightsVisible;
    for (var i = 1; i <= app.project.numItems; i++) {
        var item;
        try { item = app.project.item(i); } catch (e) { continue; }
        if (!(item instanceof CompItem)) continue;
        var l = findLayerByName(item, HIGHLIGHT_LAYER_NAME);
        if (l) { try { l.enabled = newState; } catch (e2) {} }
    }
    sessionState.highlightsVisible = newState;
    return newState;
}

// ============================================================================
// CEP-FACING API — every function below is called from client/js/main.js via
// CSInterface.evalScript() and returns a JSON string.
// ============================================================================

function csGetInfo() {
    return JSON.stringify({ ok: true, appName: APP_NAME, version: VERSION, author: AUTHOR, hasProject: !!app.project });
}

function runScan(p) {
    if (!app.project) return { ok: false, error: "No project open." };
    sessionState.scope = p.scope || "active";
    sessionState.options.ignoreAllCaps = !!p.ignoreAllCaps;
    sessionState.options.skipNumbers = !!p.skipNumbers;
    sessionState.options.allowStemming = !!p.smartMatching;
    sessionState.filter = p.filter || "all";
    sessionState.filters.ignoreHidden = !!p.ignoreHidden;
    sessionState.filters.ignoreLocked = !!p.ignoreLocked;
    sessionState.filters.selectedOnly = !!p.selectedOnly;
    sessionState.filters.forceHighlightVisibility = !!p.forceHighlightVisibility;
    sessionState.filters.disableGlobalHighlights = !!p.disableGlobalHighlights;

    ensureDictionariesLoaded();

    sessionState.findings = [];
    sessionState.seenSigs = {};
    sessionState.stats = { comps: 0, layers: 0, text: 0, expr: 0, effect: 0, name: 0, marker: 0, words: 0, errors: 0 };

    var comps = collectCompsForScope();
    for (var i = 0; i < comps.length; i++) {
        scanComp(comps[i], sessionState.findings, sessionState.seenSigs, sessionState.stats, sessionState.filters);
    }

    var analysis = analyzeFindings(sessionState.findings);
    sessionState.errors = analysis.errors;
    sessionState.order = analysis.order;
    sessionState.stats.text = analysis.stats.text;
    sessionState.stats.expr = analysis.stats.expr;
    sessionState.stats.effect = analysis.stats.effect;
    sessionState.stats.name = analysis.stats.name;
    sessionState.stats.marker = analysis.stats.marker;
    sessionState.stats.words = analysis.totalWords;
    sessionState.stats.errors = analysis.order.length;

    var words = [];
    for (var wi = 0; wi < sessionState.order.length; wi++) {
        var lower = sessionState.order[wi];
        var err = sessionState.errors[lower];
        if (!err) continue;
        var locs = [];
        for (var li = 0; li < err.locations.length; li++) {
            locs.push({ label: err.locations[li].label, sourceType: err.locations[li].finding.sourceType });
        }
        words.push({ lower: lower, word: err.word, count: err.count, locations: locs, suggestions: generateSuggestions(err.word, 6) });
    }

    var usingFallbackOnly = dictionaryData.totalMissing > 0 && dictionaryData.totalLoaded === 0;

    var highlightCount = 0;
    try {
        app.beginUndoGroup("Motion Spell Checker: Highlights");
        if (!sessionState.filters.disableGlobalHighlights && words.length > 0) {
            highlightCount = generateHighlights(sessionState.filters.forceHighlightVisibility);
        } else {
            clearAllHighlights();
            sessionState.highlightsVisible = false;
        }
        app.endUndoGroup();
    } catch (hlErr) { try { app.endUndoGroup(); } catch (e5) {} }

    return {
        ok: true,
        scope: sessionState.scope,
        stats: sessionState.stats,
        compsScanned: comps.length,
        words: words,
        usingFallbackOnly: usingFallbackOnly,
        fallbackWordCount: FALLBACK_DICTIONARY.length,
        highlightCount: highlightCount,
        highlightsVisible: sessionState.highlightsVisible
    };
}

function csScan(paramsJSON) {
    try { var p = JSON.parse(paramsJSON); return JSON.stringify(runScan(p)); }
    catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csReplace(paramsJSON) {
    try {
        var p = JSON.parse(paramsJSON);
        var err = sessionState.errors ? sessionState.errors[p.lower] : null;
        if (!err) return JSON.stringify({ ok: false, error: "Word not found in current scan." });
        var newWord = p.newWord;
        var replaced = 0, failed = 0;
        app.beginUndoGroup("Motion Spell Checker: Replace \"" + err.word + "\"");
        for (var i = 0; i < err.locations.length; i++) {
            var r = applyCorrection(err.locations[i].finding, err.word, newWord);
            if (r.success) replaced += r.count; else failed++;
        }
        app.endUndoGroup();
        return JSON.stringify({ ok: replaced > 0, replaced: replaced, failed: failed, word: err.word, newWord: newWord });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csIgnore(paramsJSON) {
    try {
        var p = JSON.parse(paramsJSON);
        sessionState.ignoredWords[p.lower] = true;
        persistIgnoredWord(p.lower);
        return JSON.stringify({ ok: true, lower: p.lower });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csAddToDictionary(paramsJSON) {
    try {
        var p = JSON.parse(paramsJSON);
        sessionState.customWords[p.lower] = true;
        addDictionaryWord(p.lower);
        persistCustomWord(p.lower);
        return JSON.stringify({ ok: true, lower: p.lower });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csVerifyDictionaries() {
    try { return JSON.stringify({ ok: true, result: verifyDictionaries() }); }
    catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csToggleHighlights() {
    try {
        var visible = toggleHighlightVisibility();
        return JSON.stringify({ ok: true, visible: visible });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csClearHighlights() {
    try {
        app.beginUndoGroup("Motion Spell Checker: Clear Highlights");
        clearAllHighlights();
        sessionState.highlightsVisible = false;
        app.endUndoGroup();
        return JSON.stringify({ ok: true });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}

function csRevealDictionaryFolder() {
    try {
        var p = getDictionaryPath();
        if (p) { var f = new Folder(p); f.execute(); return JSON.stringify({ ok: true, path: p }); }
        return JSON.stringify({ ok: false, error: "Dictionary folder not available." });
    } catch (e) { return JSON.stringify({ ok: false, error: e.toString() }); }
}
